# 🌊 TerraPulse SUBSEA — The Physical Internet & Undersea Cloud Choke Points
> **An interactive spatial dashboard exploring the seabed fiber substrate of the global internet, strategic maritime chokepoints, AWS infrastructure, and real-time seismic exposure.**  
> *Built for the AWS Weekend Challenge: Map It (October 30 – November 2, 2026).*  
> **Live Web Application:** [https://main.d348k8c7lj2tem.amplifyapp.com](https://main.d348k8c7lj2tem.amplifyapp.com)

[![Hosting](https://img.shields.io/badge/AWS-Amplify%20Hosting-FF9900?logo=aws-amplify&logoColor=white)](https://main.d348k8c7lj2tem.amplifyapp.com)
[![Basemap](https://img.shields.io/badge/Cartography-MapLibre%20GL%20v6-22E3FF)](https://maplibre.org/)
[![Data Source](https://img.shields.io/badge/Data-TeleGeography%20%2B%20USGS-10B981)](https://www.submarinecablemap.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 Executive Summary & Purpose

People often assume the "Cloud" exists in the sky or through wireless satellite constellations. In reality, **over 95% of all intercontinental internet traffic and cloud data replication** travels through glass fiber-optic tubes resting on the ocean floor—no thicker than a standard garden hose.

**TerraPulse SUBSEA** visualizes this critical physical substrate:
* **733 Subsea Cables:** Charted multi-line geometries across Atlantic, Pacific, and Indian Ocean basins with interactive route isolation.
* **1,928 Coastal Landing Hubs:** Terminal amplifier and power-feed points connecting undersea cables to continental terrestrial dark-fiber backbones.
* **28 AWS Cloud Regions:** Global cloud regions plotted with geographic and undersea landing connectivity context.
* **Strategic Chokepoint Explorer:** 1-click camera navigation into high-density bottlenecks:
  1. *Bab-el-Mandeb & Red Sea* (18 cables funneled through a narrow strait)
  2. *Strait of Malacca / Singapore* (The Asia-Pacific data super-artery)
  3. *Luzon Strait* (Site of the 2006 Hengchun M7.1 earthquake that severed 8 cables simultaneously)
* **Undersea Seismic Proximity Radar:** Streaming live USGS earthquake observations and calculating deterministic distance to the nearest seabed cable geometries using `@turf/turf`.

---

## 🗺️ How the Data Was Placed on the Map

1. **Cartography & Rendering:** The map runs on **MapLibre GL JS**, utilizing a minimalist dark-canvas vector/raster layer for high-contrast viewing of undersea fiber paths.
2. **Subsea Cable Geometries:** 733 international cables and 1,928 landing hubs are loaded from TeleGeography GeoJSON datasets and rendered as interactive line and symbol layers with custom hover and route-isolation filters.
3. **Seismic Feeds:** Live earthquake observations are pulled directly from the USGS Earthquake Hazards Program GeoJSON feed.
4. **AWS Infrastructure:** 28 core AWS Cloud Regions are plotted using geographic metropolitan coordinates to show direct spatial relationships with coastal landing stations.
5. **Spatial Proximity:** When an earthquake occurs within 100 km of a cable, **Turf.js** computes the geodesic distance to the closest cable segment and draws a yellow proximity ray linking the epicenter to the cable.

---

## 🏛️ Architecture & AWS Integration

The application is deployed as a cloud-native single-page application on **AWS Amplify Hosting**:

```
+---------------------------------------------------------------------------------------+
|                                Authoritative Data Sources                             |
|  - TeleGeography Subsea Cables & Landing Stations (733 Cables / 1,928 Landing Hubs)   |
|  - USGS Earthquake Hazards Program (Live 24h / 7d / 30d Feeds)                        |
|  - AWS Global Infrastructure Reference (28 Major Cloud Regions)                       |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                                AWS Amplify Hosting                                    |
|             (Continuous Integration & Automated Deployment from GitHub)               |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                    TerraPulse SUBSEA — Single Page Application                         |
|                                                                                       |
|  [ React 19 + TypeScript + Vite 8 + Tailwind CSS (Mission Control Dark Theme) ]       |
|                                                                                       |
|  +--------------------+  +----------------------+  +-------------------------------+  |
|  |   MapLibre GL v6   |  |     Turf.js Engine   |  |   Command Palette (Ctrl+K)    |  |
|  | Dark Basemap Canvas|  | Deterministic Math   |  | Fast Entity Filter & Jump     |  |
|  | 2D & 3D Globe Mode |  | Point-to-Line Dist   |  | Cables, Regions, Chokepoints  |  |
|  +--------------------+  +----------------------+  +-------------------------------+  |
+---------------------------------------------------------------------------------------+
```

*Note: The repository also includes a reference AWS SAM template (`backend/template.yaml`) demonstrating an automated serverless ingestion pipeline (`EventBridge -> Lambda -> S3 -> CloudFront`) for scheduled backend snapshot caching.*

---

## 🔬 Scientific Honesty & Proximity Methodology

TerraPulse SUBSEA enforces strict scientific integrity and transparent screening heuristics:
* **Distance ≠ Damage:** A live earthquake near a cable does **not** prove the cable is broken. Cable failures depend on seabed turbidity avalanches, fault scarp displacement, burial status, and armored casing. Therefore, alerts are explicitly labeled **"Potential Physical Exposure Observation"**, never "Confirmed Cut".
* **Focal Depth & Seismological Realism:** Earthquake focal depth is directly incorporated into the risk tiering heuristic. Deep-focus events (focal depth $> 70\text{ km}$) radiate seismic energy far below the ocean floor where seabed shear displacement and sediment gravity flows are geophysically improbable; they are categorized as **Advisories** and de-prioritized relative to shallow crustal events ($\le 70\text{ km}$).
* **Realistic Distance Precision:** Publicly mapped cable paths represent charted corridors rather than surveyed subsea centimeter-grade coordinates, and USGS epicenters have inherent geographic variance. Distances are expressed with realistic tolerances (`~10 km`, `~25 km`, `±10 km tolerance`) rather than false sub-kilometer precision.
* **Deterministic Spatial Screening:** Great-circle proximity is computed deterministically in-browser via Turf.js against a spatial grid index.

---

## ⚠️ Limitations

1. **Public Geometry Approximation:** Public submarine cable maps represent charted legal corridors rather than exact centimeter-grade seafloor positions.
2. **Turbidity Current Propagation:** Proximity calculations measure epicentral distance, but underwater sediment avalanches can travel tens of kilometers down continental slopes away from the epicenter.
3. **BGP Redundancy:** Physical damage to a single cable does not automatically cut internet connectivity, as autonomous systems (AS) dynamically reroute traffic across redundant network paths.
4. **USGS Feed Latency:** Seismic events require sensor network triangulation and automated/manual review, resulting in a reporting latency of a few minutes.

---

## 🛰️ Authoritative Datasets & Attribution

1. **Submarine Cable Map:**
   - 733 international submarine cables & 1,928 coastal landing points.
   - Sourced under Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0): `Data © TeleGeography (submarinecablemap.com)`.
2. **USGS Earthquake Hazards Program:**
   - Real-time GeoJSON feeds (Past 24h, 7d, 30d, M4.0+).
   - Source: [USGS Earthquakes Feed](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php).
3. **AWS Global Infrastructure:**
   - Official AWS Region locations and launch timelines.
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

## 📄 License
* Application source code is released under the [MIT License](LICENSE).
* Submarine cable data © TeleGeography ([CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)).
* Seismic feeds courtesy of the U.S. Geological Survey (USGS).
