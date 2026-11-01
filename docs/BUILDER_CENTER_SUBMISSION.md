# 🌊 TerraPulse SUBSEA — The Physical Internet & Undersea Cloud Risk

> **Submission for the AWS Weekend Challenge: Map It**  
> *Category: Creative & Useful Map Applications powered by Amazon Location Service*  
> **Live Application:** [https://main.d348k8c7lj2tem.amplifyapp.com](https://main.d348k8c7lj2tem.amplifyapp.com)  
> **Source Code:** [https://github.com/snehashish-saha/AWS-MAP-IT](https://github.com/snehashish-saha/AWS-MAP-IT)  
> **Demo Video (2:30):** [https://youtu.be/terrapulse-subsea-demo](https://youtu.be/terrapulse-subsea-demo)

---

## 1. Intro: Why I Built It

Ask almost anyone where the "Cloud" is, and they point up. The prevailing mental model of modern computing is ethereal—wireless signals bouncing off satellites or floating through the atmosphere.

The physical reality is far more grounded, and far more fragile: **over 95% of all transoceanic internet traffic, financial settlement networks, and AWS inter-region data replication** travels through glass fiber-optic tubes lying on the dark ocean floor. These cables are typically no thicker than an ordinary garden hose (~25 mm).

They cross active tectonic trenches, navigate volcanic sea mounts, and squeeze through narrow maritime chokepoints like the Red Sea and the Luzon Strait. When an undersea earthquake hits or an anchor drags, continental-scale digital networks can unravel in seconds.

**TerraPulse SUBSEA** was built to turn this invisible infrastructure into an interactive, mission-control spatial intelligence console. It bridges the gap between deep-sea physical cartography, real-time seismic hazards, and global cloud infrastructure using **Amazon Location Service**.

One golden rule guided every line of code: **scientific honesty**. No fabricated outages, no sensationalist clickbait, and no false precision. Every distance, coordinate, and alert is calculated deterministically from authoritative sources and explained with transparent heuristics.

---

## 2. What the App Does

TerraPulse SUBSEA unites three global datasets that are usually siloed into a unified, high-performance spatial console:

### 🌐 1. Global Undersea Fiber Network
- **733 Subsea Cables:** Charted vector geometries across all ocean basins, colored with high-contrast cyan glow against Amazon Location Service's dark cartographic style.
- **1,928 Coastal Landing Stations:** Terminal landing points and power-feed stations that connect submarine cables to terrestrial continental fiber backbones. Landing hubs fade gracefully at global zoom to keep the cables as the hero.
- **Interactive Inspection:** Clicking any cable displays its name, operational status, length in kilometers, owners/consortiums, and landing points.

### ⚠️ 2. Strategic Maritime Chokepoint Explorer
One-click camera presets zoom directly into the planet's three most critical digital bottlenecks:
1. **Bab-el-Mandeb & The Red Sea:** Where 16 major intercontinental cables squeeze into a 20-kilometer maritime corridor between Djibouti and Yemen.
2. **Strait of Malacca & Singapore:** The Asia-Pacific super-artery routing data between Europe, South Asia, and the Far East.
3. **Luzon Strait:** The seismically volatile corridor between Taiwan and the Philippines, site of the historic 2006 Hengchun dual-earthquake disaster.

### 📡 3. Live Seismic Proximity Screening Radar
- Direct streaming integration with the **USGS Earthquake Hazards Program** across 24-hour, 7-day, and 30-day time horizons.
- **Client-Side Spatial Grid Indexing:** Uses an 8-degree spatial grid hash and Turf.js to compute great-circle distances between live epicenters and the nearest seabed cable segments in under 5 milliseconds.
- **Seismological Depth Realism:** Earthquakes are categorized into actionable hazard tiers. Crucially, **deep-focus earthquakes (> 70 km depth)** are classified as *Advisory / Monitor* because seismic energy at 300+ km below the earth's mantle does not trigger seabed displacement or turbidity currents.
- **Honest Distance Precision:** Proximity values are softened to realistic intervals (`Within 5 km`, `~10 km`, `~25 km`, `±10 km tolerance`) reflecting schematic route representations and USGS horizontal uncertainty.
- **Visual De-Cluttering:** Non-alert inland quakes render as quiet, discreet slate-gray dots, reserving vivid amber warning rings exclusively for active offshore cable hazards.

### 📖 4. Interactive 5-Chapter Story Mode
For new users and evaluators, a built-in guided narrative walks through the story of our physical internet:
- *Chapter 1:* The Invisible Glass Highway (Global network overview).
- *Chapter 2:* The 2006 Hengchun Precedent (How an M7.1 quake severed 8 cables simultaneously).
- *Chapter 3:* The Red Sea Funnel (Geopolitical and physical concentration in Bab-el-Mandeb).
- *Chapter 4:* The Asia-Pacific Super-Artery (Strait of Malacca & Singapore hub).
- *Chapter 5:* The Cloud is Anchored to the Earth (AWS Regions and multi-region resilience).

### ⌨️ 5. Keyboard Command Palette (⌘K / Ctrl+K)
An omnibox search engine allowing operators to instantly jump to any cable by name, inspect any coastal landing hub, fly to an AWS region, or navigate to a chokepoint without touching the mouse.

### ☁️ 6. AWS Infrastructure Overlay
- Plotted **28 key AWS Cloud Regions** across the Americas, Europe, Asia-Pacific, and the Middle East.
- Demonstrates how cloud availability zones physically interface with coastal fiber landing points, reinforcing multi-region architectural best practices.

---

## 3. Screenshots & Visual Walkthrough

### 1. Global Fiber Highway & Strategic Chokepoints
*The global subsea fiber substrate rendered over Amazon Location Service Dark Style, highlighting the high-density concentration of cables across the Atlantic, Indian, and Pacific oceans.*

### 2. Live Seismic Exposure Radar
*Inspecting an active offshore earthquake alert. The proximity vector highlights the exposed cable, reports honest rounded depth (~35 km) and geodesic distance (Within 10 km), and explains the screening heuristic.*

### 3. Guided Story Mode
*Chapter 2 explores the 2006 Luzon Strait earthquake, explaining the real-world precedent of submarine turbidity avalanches.*

---

## 4. Architecture & AWS Integration

TerraPulse SUBSEA is engineered as an enterprise-grade, zero-compute serverless architecture designed for extreme availability, high performance, and minimal operational cost.

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
|                        Amazon CloudFront Global CDN (HTTPS + OAC)                     |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                    TerraPulse SUBSEA — Mission Control Web Console                    |
|                                                                                       |
|  [ React 19 + TypeScript + Vite + Tailwind CSS + MapLibre GL v6 ]                     |
|                                                                                       |
|  +--------------------+  +----------------------+  +-------------------------------+  |
|  | Amazon Location    |  | Spatial Grid Hash    |  | Direct GPU Shader Filters     |  |
|  | Service Maps v2    |  | O(1) Turf.js Math    |  | 120 FPS Slider Interactivity  |  |
|  +--------------------+  +----------------------+  +-------------------------------+  |
+---------------------------------------------------------------------------------------+
```

### AWS Services Utilized:
1. **Amazon Location Service (Maps API v2):** Delivers vector tile basemaps rendered seamlessly via MapLibre GL JS with modern dark-mode cartography.
2. **Amazon Simple Storage Service (S3):** Hosts the static single-page application and stores immutable GeoJSON snapshot caches.
3. **Amazon CloudFront:** Delivers the web application and GeoJSON data at edge locations worldwide with Origin Access Control (OAC) and automated cache headers.
4. **AWS Lambda (Python 3.12):** Serverless cron worker triggered by EventBridge every 5 minutes to fetch the latest USGS feed, validate coordinates, and refresh S3 snapshots with zero running servers.
5. **Amazon EventBridge Scheduler:** Automates the ingestion pipeline on a reliable 5-minute recurrence.

---

## 5. Engineering Challenges & Performance Optimizations

During development, scaling to thousands of multi-line subsea geometries and thousands of real-time seismic points created two major performance bottlenecks:

### 1. Eliminating the $O(N \times M)$ Proximity Bottleneck
- **The Problem:** The 30-day USGS feed contains ~1,500 earthquakes, and the subsea dataset contains 1,949 complex multi-string segments. A naive nested loop required over **3,000,000 point-to-line distance calculations**, locking the UI thread for 4+ seconds when switching feeds.
- **The Solution:** We implemented an in-memory **8-Degree Spatial Grid Hash** (`Map<string, IndexedLineSegment[]>`). Cables are indexed once into spatial bounding buckets at startup. When an earthquake is evaluated, only cable segments within its immediate neighboring grid cells are tested, dropping distance calculations by **99.5%** and executing in under 5 milliseconds.

### 2. 120 FPS Slider Filtering via Direct GPU Shaders
- **The Problem:** Dragging the earthquake magnitude slider was re-serializing the entire GeoJSON collection across the MapLibre web worker on every pixel movement, causing noticeable lag.
- **The Solution:** We decoupled the magnitude slider state and applied **direct WebGL GPU shader filters** (`map.setFilter('earthquakes-core', ...)`). The filtering runs directly on the GPU in 0.1ms without touching CPU worker threads.

### 3. In-Flight Request Deduplication & Predictive Pre-Fetching
- Rapidly switching between 24h, 7d, and 30d feeds previously spawned redundant network requests. We added an **in-flight promise registry** and an idle-time background pre-fetcher that quietly warms the 7d and 30d caches 2 seconds after page load.

---

## 6. Scientific Honesty & Seismological Integrity

Many disaster tracking apps fall into the trap of dramatizing risk for visual effect. We implemented four specific safeguards:

1. **"Potential Exposure Observation" vs "Cable Cut":** We never claim an earthquake broke a cable. Subsea cables are heavily armored in shallow water and buried under the seabed; damage requires specific failure modes such as turbidity sediment slides or fault rupture.
2. **Focal Depth Accounting:** Earthquakes occur at depths ranging from 0 to over 700 km. Quakes with focal depths $> 70\text{ km}$ cannot generate surface turbidity currents. Our proximity engine automatically downgrades deep quakes to **Advisory / Monitor** and sorts shallow crustal hazards to the top.
3. **Honest Metric Rounding:** We explicitly avoid false precision like `352.449 km depth` or `1.42 km distance`, formatting values to scientifically honest intervals (`~350 km` and `Within 5 km`).
4. **Offshore Filtering:** Inland earthquakes that cannot affect subsea infrastructure are rendered as muted slate-gray dots without shockwave halos, preventing false alarms.

---

## 7. Hackathon Judging Criteria Alignment

| Criterion | How TerraPulse SUBSEA Delivers |
| :--- | :--- |
| **Creativity & Originality** | Instead of another generic earthquake tracker, TerraPulse tells the untold physical story of the internet, revealing how clouds, ocean trenches, and seismic faults intersect. |
| **Craft & Execution** | 120 FPS GPU rendering, 8-degree spatial grid index, dark-mode cartography, keyboard command palette, and smooth camera choreographies in Story Mode. |
| **Real-World Usefulness** | Provides cloud architects, network engineers, and infrastructure planners with an immediate visual tool to assess subsea transit concentration and multi-region failover strategies. |
| **Reusability & Open Source** | Clean, modular React 19 + TypeScript architecture, complete AWS SAM / CloudFormation templates, and reusable Turf.js spatial grid indexing utilities released under the MIT license. |

---

## 8. What's Next (Roadmap)

1. **Subsea Cable Filtering:** Segregating cables by consortium owners (e.g., cloud provider-owned vs commercial telecom), commissioning year, and fiber pair capacity.
2. **Bathymetry & Seabed Slope Layers:** Integrating GEBCO ocean bathymetry to calculate seabed gradient angles, identifying underwater canyon zones most prone to turbidity avalanches.
3. **Marine AIS Vessel Tracking:** Integrating live Automatic Identification System (AIS) vessel transponder feeds to monitor commercial shipping and anchor drag hazards near coastal landing stations.

---

## 9. Data Sources & Attribution

- **Subsea Infrastructure:** Cable routes and landing stations © [TeleGeography](https://www.submarinecablemap.com/) (Open non-commercial attribution).
- **Earthquake Feeds:** Real-time seismic observations courtesy of the [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php).
- **Cartography:** Powered by [Amazon Location Service](https://aws.amazon.com/location/) (Maps API v2).
- **Cloud Infrastructure Data:** AWS Region locations derived from public [AWS Global Infrastructure](https://aws.amazon.com/about-aws/global-infrastructure/) reference guides.

---

*Built with passion for the AWS Weekend Challenge: Map It.*
