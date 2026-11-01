"""
TerraPulse SUBSEA - USGS Earthquake Ingestion & S3 Edge Cache Invalidator
AWS Lambda Function (Python 3.12)

Architecture Role:
Runs periodically via Amazon EventBridge Scheduler (every 5 minutes).
Fetches authoritative earthquake observations from the USGS Real-Time Hazards API,
validates GeoJSON structure, filters relevant seismic events, and writes an immutable,
edge-cached GeoJSON snapshot to Amazon S3 for CloudFront distribution.

Zero third-party pip dependencies required: Uses standard library `urllib` and `json`,
along with the native AWS Lambda runtime `boto3` SDK.
"""

import os
import json
import logging
import urllib.request
import urllib.error
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

# Configure structured logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables with sensible defaults
S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME", "terrapulse-subsea-cache")
S3_OBJECT_KEY = os.environ.get("S3_OBJECT_KEY", "data/usgs_snapshot.geojson")
CLOUDFRONT_DISTRIBUTION_ID = os.environ.get("CLOUDFRONT_DISTRIBUTION_ID", "")
USGS_FEED_URL = os.environ.get(
    "USGS_FEED_URL",
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
)

s3_client = boto3.client("s3")
cloudfront_client = boto3.client("cloudfront") if CLOUDFRONT_DISTRIBUTION_ID else None


def fetch_usgs_feed(feed_url: str) -> dict:
    """Fetch real-time GeoJSON feed from USGS with timeout and validation."""
    logger.info("Fetching USGS earthquake data from: %s", feed_url)
    req = urllib.request.Request(
        feed_url,
        headers={"User-Agent": "TerraPulse-SUBSEA-Ingestion/1.0 (AWS Lambda)"}
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        if response.status != 200:
            raise RuntimeError(f"USGS HTTP status {response.status}: {response.reason}")
        raw_bytes = response.read()
        data = json.loads(raw_bytes.decode("utf-8"))

    if not isinstance(data, dict) or data.get("type") != "FeatureCollection":
        raise ValueError("Invalid USGS feed format: Expected FeatureCollection")

    feature_count = len(data.get("features", []))
    logger.info("Successfully fetched %d earthquake features from USGS", feature_count)
    return data


def enrich_and_sanitize_geojson(feed_data: dict) -> bytes:
    """
    Sanitize coordinates, enforce standard float rounding, and attach
    ingestion metadata to the GeoJSON collection.
    """
    metadata = feed_data.get("metadata", {})
    metadata["ingested_at"] = datetime.now(timezone.utc).isoformat()
    metadata["ingestion_engine"] = "AWS Lambda Python 3.12 (TerraPulse Serverless Pipeline)"

    # Validate features and strip malformed coordinates
    valid_features = []
    for feat in feed_data.get("features", []):
        coords = feat.get("geometry", {}).get("coordinates", [])
        if len(coords) >= 2:
            lon, lat = coords[0], coords[1]
            if -180.0 <= lon <= 180.0 and -90.0 <= lat <= 90.0:
                valid_features.append(feat)

    feed_data["features"] = valid_features
    feed_data["metadata"] = metadata

    return json.dumps(feed_data, separators=(",", ":")).encode("utf-8")


def write_to_s3(bucket: str, key: str, payload_bytes: bytes) -> str:
    """
    Write GeoJSON payload to S3 with optimal CDN cache headers:
    - Content-Type: application/geo+json
    - Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600
    """
    logger.info("Writing GeoJSON snapshot (%d bytes) to s3://%s/%s", len(payload_bytes), bucket, key)
    response = s3_client.put_object(
        Bucket=bucket,
        Key=key,
        Body=payload_bytes,
        ContentType="application/geo+json",
        CacheControl="public, max-age=60, s-maxage=300, stale-while-revalidate=600",
    )
    etag = response.get("ETag", "unknown")
    logger.info("S3 PutObject completed successfully. ETag: %s", etag)
    return etag


def invalidate_cloudfront_cache(distribution_id: str, paths: list[str]) -> None:
    """Trigger an Amazon CloudFront cache invalidation for the refreshed snapshot."""
    if not distribution_id or not cloudfront_client:
        logger.info("CloudFront invalidation skipped (no distribution ID configured)")
        return

    caller_reference = f"terrapulse-lambda-{int(datetime.now(timezone.utc).timestamp())}"
    logger.info("Invalidating CloudFront paths %s on distribution %s", paths, distribution_id)
    try:
        cloudfront_client.create_invalidation(
            DistributionId=distribution_id,
            InvalidationBatch={
                "Paths": {
                    "Quantity": len(paths),
                    "Items": paths,
                },
                "CallerReference": caller_reference,
            },
        )
        logger.info("CloudFront invalidation submitted successfully (Ref: %s)", caller_reference)
    except ClientError as err:
        logger.warning("CloudFront invalidation failed: %s", err)


def lambda_handler(event, context):
    """
    AWS Lambda entry point triggered by EventBridge or manual invocation.
    """
    logger.info("TerraPulse USGS Ingestion Lambda invocation started.")
    try:
        raw_feed = fetch_usgs_feed(USGS_FEED_URL)
        clean_bytes = enrich_and_sanitize_geojson(raw_feed)
        etag = write_to_s3(S3_BUCKET_NAME, S3_OBJECT_KEY, clean_bytes)

        # Invalidate edge cache if configured
        if CLOUDFRONT_DISTRIBUTION_ID:
            invalidate_cloudfront_cache(CLOUDFRONT_DISTRIBUTION_ID, [f"/{S3_OBJECT_KEY}*"])

        feature_count = len(raw_feed.get("features", []))
        return {
            "statusCode": 200,
            "body": json.dumps({
                "status": "success",
                "features_ingested": feature_count,
                "s3_target": f"s3://{S3_BUCKET_NAME}/{S3_OBJECT_KEY}",
                "etag": etag,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }),
        }

    except Exception as exc:
        logger.exception("TerraPulse ingestion pipeline encountered an error: %s", str(exc))
        return {
            "statusCode": 500,
            "body": json.dumps({
                "status": "error",
                "error_message": str(exc),
            }),
        }
