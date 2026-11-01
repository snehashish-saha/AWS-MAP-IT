"""
TerraPulse SUBSEA - USGS Earthquake Ingestion & DynamoDB Incident Logger
AWS Lambda Function (Python 3.12)

Architecture Role:
Periodically triggered by Amazon EventBridge (every 5 minutes).
1. Ingests real-time seismic event feeds directly from the USGS Hazards API.
2. Identifies earthquakes near key subsea cable corridors.
3. Automatically writes incident audit records into Amazon DynamoDB (table: `TerraPulseAlerts`).
4. Optionally edge-caches the GeoJSON snapshot to Amazon S3.

Zero pip dependencies required: Uses standard library `urllib`, `json`, and native AWS `boto3`.
"""

import os
import json
import logging
import urllib.request
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables with sensible defaults
DYNAMODB_TABLE_NAME = os.environ.get("DYNAMODB_TABLE", "TerraPulseAlerts")
S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME", "")
S3_OBJECT_KEY = os.environ.get("S3_OBJECT_KEY", "data/usgs_snapshot.geojson")
USGS_FEED_URL = os.environ.get(
    "USGS_FEED_URL",
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
)

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
s3_client = boto3.client("s3") if S3_BUCKET_NAME else None

# Strategic subsea chokepoints / high-density cable corridors for backend screening
STRATEGIC_CORRIDORS = [
    {
        "name": "Bab-el-Mandeb & Red Sea",
        "bounds": [30.0, 10.0, 45.0, 30.0],  # [min_lon, min_lat, max_lon, max_lat]
        "cables": "AAE-1, SEA-ME-WE 5, EIG, PEACE Cable, 2Africa",
    },
    {
        "name": "Strait of Malacca & Singapore",
        "bounds": [95.0, -2.0, 106.0, 8.0],
        "cables": "SEA-ME-WE 3, SJC, APG, Indigo-West, ECHO",
    },
    {
        "name": "Luzon Strait & Taiwan Trench",
        "bounds": [118.0, 18.0, 126.0, 24.0],
        "cables": "EAC-C2C, APCN-2, SJC2, FASTER, PLCN",
    },
    {
        "name": "Transpacific Japan Trench",
        "bounds": [135.0, 30.0, 148.0, 42.0],
        "cables": "JUPITER, FASTER, PC-1, Unity, SJC",
    },
    {
        "name": "Panama & Caribbean Isthmus",
        "bounds": [-85.0, 6.0, -75.0, 12.0],
        "cables": "Pan-American Crossing (PAC), ARCOS, MAYA-1",
    },
]


def fetch_usgs_feed(feed_url: str) -> dict:
    """Fetch real-time GeoJSON feed from USGS."""
    logger.info("Fetching USGS earthquake data from: %s", feed_url)
    req = urllib.request.Request(
        feed_url,
        headers={"User-Agent": "TerraPulse-SUBSEA-Ingestion/1.0 (AWS Lambda)"}
    )
    with urllib.request.urlopen(req, timeout=12) as response:
        if response.status != 200:
            raise RuntimeError(f"USGS HTTP status {response.status}: {response.reason}")
        return json.loads(response.read().decode("utf-8"))


def evaluate_chokepoint_exposure(lon: float, lat: float) -> dict | None:
    """Check if epicenter lies within strategic subsea fiber corridors."""
    for corridor in STRATEGIC_CORRIDORS:
        min_lon, min_lat, max_lon, max_lat = corridor["bounds"]
        if min_lon <= lon <= max_lon and min_lat <= lat <= max_lat:
            return corridor
    return None


def format_risk_tier(magnitude: float, depth_km: float) -> tuple[str, str]:
    """Scientific screening heuristic incorporating focal depth realism."""
    if depth_km > 70.0:
        return "ADVISORY_MONITOR", f"Deep-focus event ({depth_km:.0f} km); seabed rupture unlikely"
    if magnitude >= 6.0:
        return "HIGH_PHYSICAL_HAZARD", "Shallow severe crustal event; potential seabed shear"
    if magnitude >= 4.8:
        return "ELEVATED_MONITOR", "Moderate energy; within proximity buffer"
    return "ADVISORY_MONITOR", "Minor energy observation"


def write_incidents_to_dynamodb(table_name: str, features: list[dict]) -> int:
    """Persist flagged seismic events near subsea corridors to DynamoDB."""
    try:
        table = dynamodb.Table(table_name)
    except Exception as e:
        logger.warning("Could not connect to DynamoDB table %s: %s", table_name, e)
        return 0

    logged_count = 0
    now_iso = datetime.now(timezone.utc).isoformat()

    for feat in features:
        coords = feat.get("geometry", {}).get("coordinates", [])
        if len(coords) < 3:
            continue

        lon, lat, depth_km = float(coords[0]), float(coords[1]), float(coords[2])
        props = feat.get("properties", {})
        mag = float(props.get("mag") or 0.0)
        quake_id = str(feat.get("id") or "")

        # Evaluate against strategic cable corridors
        corridor = evaluate_chokepoint_exposure(lon, lat)
        if not corridor and mag < 4.5:
            continue

        tier, tier_desc = format_risk_tier(mag, depth_km)
        incident_id = f"INCIDENT#{quake_id}"

        item = {
            "incident_id": incident_id,
            "usgs_id": quake_id,
            "place": str(props.get("place") or "Offshore"),
            "magnitude": str(round(mag, 1)),
            "depth_km": str(round(depth_km, 1)),
            "latitude": str(round(lat, 4)),
            "longitude": str(round(lon, 4)),
            "hazard_tier": tier,
            "heuristic_note": tier_desc,
            "strategic_corridor": corridor["name"] if corridor else "Global Offshore Route",
            "exposed_cables": corridor["cables"] if corridor else "Transoceanic Corridors",
            "logged_at": now_iso,
            "event_time_utc": datetime.fromtimestamp(props.get("time", 0) / 1000.0, timezone.utc).isoformat() if props.get("time") else now_iso,
        }

        try:
            table.put_item(Item=item)
            logged_count += 1
        except ClientError as ce:
            logger.warning("Failed writing item %s to DynamoDB: %s", incident_id, ce)
        except Exception as ex:
            logger.warning("Error putting item to DynamoDB: %s", ex)

    logger.info("Successfully logged %d incidents into DynamoDB table '%s'", logged_count, table_name)
    return logged_count


def lambda_handler(event, context):
    """AWS Lambda entry point."""
    logger.info("Starting TerraPulse Seismic Monitor execution...")
    try:
        raw_feed = fetch_usgs_feed(USGS_FEED_URL)
        features = raw_feed.get("features", [])
        total_quakes = len(features)

        # Write to DynamoDB
        logged_incidents = write_incidents_to_dynamodb(DYNAMODB_TABLE_NAME, features)

        # Write S3 cache snapshot if bucket configured
        s3_status = "skipped"
        if S3_BUCKET_NAME and s3_client:
            try:
                clean_payload = json.dumps(raw_feed, separators=(",", ":")).encode("utf-8")
                s3_client.put_object(
                    Bucket=S3_BUCKET_NAME,
                    Key=S3_OBJECT_KEY,
                    Body=clean_payload,
                    ContentType="application/geo+json",
                    CacheControl="public, max-age=120"
                )
                s3_status = f"s3://{S3_BUCKET_NAME}/{S3_OBJECT_KEY}"
            except Exception as s3_err:
                logger.warning("S3 cache upload skipped or failed: %s", s3_err)

        return {
            "statusCode": 200,
            "body": json.dumps({
                "status": "success",
                "total_usgs_quakes": total_quakes,
                "incidents_logged_to_dynamodb": logged_incidents,
                "dynamodb_table": DYNAMODB_TABLE_NAME,
                "s3_cache": s3_status,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }),
        }

    except Exception as exc:
        logger.exception("Lambda handler error: %s", exc)
        return {
            "statusCode": 500,
            "body": json.dumps({
                "status": "error",
                "error_message": str(exc),
            }),
        }
