# 🌊 TerraPulse SUBSEA — The Physical Internet & Undersea Cloud Choke Points
> **A mission-control spatial intelligence console exploring the seabed fiber substrate of the global internet, strategic maritime chokepoints, AWS infrastructure, and real-time seismic exposure.**  
> *Built for the AWS Weekend Challenge: Map It (October 30 – November 2, 2026).*  
> **Live Web Application:** [https://main.d348k8c7lj2tem.amplifyapp.com](https://main.d348k8c7lj2tem.amplifyapp.com)

[![AWS Cloud](https://img.shields.io/badge/AWS-Amazon%20Location%20Service-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/location/)
[![Hosting](https://img.shields.io/badge/AWS-S3%20%2B%20CloudFront-232F3E?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/s3/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Basemap](https://img.shields.io/badge/Cartography-MapLibre%20GL%20v6-22E3FF)](https://maplibre.org/)
[![Data Source](https://img.shields.io/badge/Data-TeleGeography%20%2B%20USGS-10B981)](https://www.submarinecablemap.com/)

---

## 📌 Executive Summary & Purpose

People often assume the "Cloud" exists in the sky or through wireless satellite constellations. In reality, **over 95% of all intercontinental internet traffic and AWS inter-region data replication** travels through glass fiber-optic tubes resting on the ocean floor—no thicker than a standard garden hose.

**TerraPulse SUBSEA** visualizes this critical, fragile physical substrate:
* **733 Subsea Cables:** Charted multi-line geometries across Atlantic, Pacific, and Indian Ocean basins with interactive route isolation.
* **1,928 Coastal Landing Hubs:** Terminal amplifier and power-feed points connecting undersea cables to continental terrestrial dark-fiber backbones.
* **28 AWS Cloud Regions:** Key global cloud regions plotted with geographic and undersea landing connectivity context.
* **Strategic Chokepoint Explorer:** 1-click camera dives into high-density bottlenecks:
  1. *Bab-el-Mandeb & Red Sea* (16+ cables squeezed into a 20km trench)
  2. *Strait of Malacca / Singapore* (The Asia-Pacific super-artery)
  3. *Luzon Strait* (Site of the 2006 Hengchun M7.1 earthquake that severed 8 cables simultaneously)
* **Undersea Seismic Proximity Radar:** Streaming live USGS earthquake observations and calculating deterministic great-circle distance to the nearest seabed cable geometries using `@turf/turf`.

---

## 🏛 Architecture & AWS Integration

TerraPulse SUBSEA is engineered for production reliability, edge-caching performance, and zero-compute cost leaks.

```
+---------------------------------------------------------------------------------------+
|                                Authoritative Data Sources                             |
|  - TeleGeography Subsea Cables & Landing Stations (733 Cables / 1,928 Landing Hubs)   |
|  - USGS Earthquake Hazards Program (Live 24h / 7d / 30d Feeds)                        |
|  - AWS Global Infrastructure Reference (28 Major Cloud Regions in Dataset)            |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                         AWS Serverless Data & Ingestion Pipeline                      |
|                                                                                       |
|   [ Amazon EventBridge Scheduler ] ──(Rate: 5 min)──▶ [ AWS Lambda Ingestion ]       |
|                                                                 │                     |
|                                                                 v                     |
|                                                     [ Amazon S3 Private Bucket ]      |
|                                                     (GeoJSON Snapshot Cache)          |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                              Amazon CloudFront CDN (HTTPS)                            |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                    TerraPulse SUBSEA — Single Page Application                         |
|                                                                                       |
|  [ React 19 + TypeScript + Vite 8 + Tailwind CSS (Mission Control Dark Void Theme) ]   |
|                                                                                       |
|  +--------------------+  +----------------------+  +-------------------------------+  |
|  |   MapLibre GL v6   |  |     Turf.js Engine   |  |   Command Palette (⌘K)        |  |
|  | Amazon Location    |  | Deterministic Math   |  | Deterministic Intent Parser   |  |
|  | Maps v2 Dark Style |  | Point-to-Line Dist   |  | Quick Jump & Search Index     |  |
|  +--------------------+  +----------------------+  +-------------------------------+  |
+---------------------------------------------------------------------------------------+
```

### Key AWS Services Used:
1. **Amazon Location Service (Maps API v2):** Delivers clean, vector/raster basemaps (`color-scheme=Dark`) directly via MapLibre GL JS with API key authorization.
2. **Amazon Simple Storage Service (S3):** Hosts the static production build and caches immutable GeoJSON snapshots of cable and landing point geometries.
3. **Amazon CloudFront:** Delivers the web application and cached data assets over HTTPS with global low latency.

---

## 🔬 Scientific Honesty & Proximity Methodology

TerraPulse SUBSEA enforces strict scientific integrity and transparent screening heuristics:
* **Proximity $\neq$ Damage:** A live earthquake within 50 km of a cable does **not** prove the cable is broken. Cable failures depend on seabed turbidity avalanches, fault scarp displacement, burial status, and armored casing. Therefore, alerts are explicitly labeled **"Potential Physical Exposure Observation"**, never "Confirmed Cut".
* **Focal Depth & Seismological Realism:** Earthquake focal depth is directly incorporated into the risk tiering heuristic. Deep-focus events (focal depth $> 70\text{ km}$) radiate seismic energy far below the ocean floor where seabed shear displacement and sediment gravity flows are geophysically improbable; they are categorized as **Advisory / Monitor** and de-prioritized relative to shallow crustal events ($\le 70\text{ km}$).
* **Realistic Distance Precision:** Publicly mapped cable paths represent charted corridors rather than surveyed subsea centimeter-grade coordinates, and USGS epicenters have inherent geographic variance. Distances are expressed with realistic tolerances (`Within 5 km`, `~10 km`, `~25 km`, `±10 km tolerance`) rather than false sub-kilometer precision.
* **Deterministic Spatial Screening:** Great-circle proximity is computed deterministically in-browser via Turf.js against a fast spatial grid index—zero AI hallucinations or fabricated outages.

---

## 🛰 Authoritative Datasets & Attribution

1. **Submarine Cable Map:**
   - 733 international submarine cables & 1,928 coastal landing points.
   - Sourced under open non-commercial attribution: `Data © TeleGeography (submarinecablemap.com)`.
2. **USGS Earthquake Hazards Program:**
   - Real-time GeoJSON feeds (Past 24h, 7d, 30d, M4.5+).
   - Source: [USGS Earthquakes Feed](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php).
3. **AWS Global Infrastructure:**
   - Official AWS Region locations and launch timelines.
   - Labeled as approximate metropolitan centers.
   - Source: [AWS Global Infrastructure](https://aws.amazon.com/about-aws/global-infrastructure/).

---

## 🚀 Local Development & Quickstart

```bash
# 1. Clone the repository
git clone https://github.com/snehashish-saha/AWS-MAP-IT.git
cd AWS-MAP-IT

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
```
Generates a self-contained static distribution in `dist/`.

---

## ☁️ AWS S3 & CloudFront Deployment

```bash
# 1. Create S3 Bucket
aws s3 mb s3://terrapulse-subsea-2026 --region us-east-1

# 2. Enable Static Website Hosting
aws s3 website s3://terrapulse-subsea-2026/ --index-document index.html --error-document index.html

# 3. Sync Production Build
aws s3 sync dist/ s3://terrapulse-subsea-2026/ --delete
```

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
Submarine cable data © TeleGeography. Seismic feeds courtesy of the U.S. Geological Survey (USGS).
