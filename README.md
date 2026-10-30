# 🌍 TerraPulse — Global Earth Intelligence
> **A map-first platform for real-time earthquake activity, atmospheric weather context, and AI-assisted geospatial exploration.**  
> *Built for the AWS Weekend Challenge: Map It (October 30 – November 2, 2026).*

[![AWS Cloud](https://img.shields.io/badge/AWS-S3%20Static%20Hosting-232F3E?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/s3/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![AI Engine](https://img.shields.io/badge/AI-Gemini%203.1%20Flash--Lite-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Basemap](https://img.shields.io/badge/Cartography-OpenFreeMap%20Dark-1C2A3A)](https://openfreemap.org/)

---

## 📌 Executive Summary & Purpose

Spatial data reveals critical insights when placed on an interactive map. **TerraPulse** turns live global geoscientific records into an exploratory command center. Rather than a static or disconnected table of numbers, TerraPulse layers real-time **USGS seismic feeds** alongside **Open-Meteo numerical atmospheric forecasts** onto a hardware-accelerated WebGL vector map.

Complementing manual cartographic exploration, TerraPulse embeds an **AI Earth Copilot (Gemini 3.1 Flash-Lite)**. Instead of merely answering questions in a side panel, the Copilot translates natural-language queries into safe, structured JSON actions that dynamically manipulate the map camera, filter criteria, and telemetry records.

---

## 🏛 Architecture & AWS Integration

TerraPulse is designed specifically for high reliability and strictly conforms to **AWS Academy Learner Lab** constraints ($50 budget guardrail).

```
                      +-----------------------------------+
                      |       Public Spatial Feeds        |
                      |  - USGS Earthquake GeoJSON Feeds  |
                      |  - Open-Meteo Forecast API        |
                      +-----------------+-----------------+
                                        | (HTTPS)
                                        v
+---------------------------------------------------------------------------------+
|                       TerraPulse Single Page Application                        |
|                                                                                 |
|  [React 19 + TypeScript + Vite + Tailwind CSS (Orbital Dark Sci-Fi Theme)]      |
|                                                                                 |
|  +--------------------+  +----------------------+  +-------------------------+  |
|  |   MapLibre GL JS   |  | Deterministic Engine |  |  Gemini AI Copilot      |  |
|  | WebGL Clustering   |  | Statistical Metrics  |  |  Schema Validation      |  |
|  | OpenFreeMap Dark   |  | Depth & Histograms   |  |  Map Action Dispatcher  |  |
|  +--------------------+  +----------------------+  +-------------------------+  |
+---------------------------------------+-----------------------------------------+
                                        |
                             (Static Production Build)
                                        v
                      +-----------------------------------+
                      |      Amazon S3 Web Hosting        |
                      |   - Static SPA Distribution       |
                      |   - Demo GeoJSON Snapshot Cache   |
                      |   - Zero-Compute Cost Footprint   |
                      +-----------------------------------+
```

### Why Amazon S3?
- **Zero Ongoing Compute Leaks:** Eliminates the risk of runaway EC2, NAT Gateway, or database costs within the Learner Lab.
- **High-Performance Edge Serving:** Delivers minified assets, vector map styles, and static GeoJSON fixtures with sub-second latency.
- **Genuine AWS Data Service Integration:** Fully meets the challenge criterion for hosting the application and spatial data snapshots on AWS infrastructure.

---

## 🛰 Authoritative Datasets & Attribution

1. **USGS Earthquake Hazards Program (USGS GeoJSON Feeds)**
   - Feeds utilized: Past Hour, Past 24 Hours, Past 7 Days, Past 30 Days, M4.5+ (7 Days), and Significant (7 Days).
   - Frequency: Real-time updates refreshed every 60 seconds.
   - Coordinate validation: Longitude ($X$), Latitude ($Y$), Depth in kilometers ($Z$).
   - Source: [USGS Earthquake API Documentation](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php).

2. **Open-Meteo Weather Forecast API**
   - Point weather observations and 7-day model-derived forecasts (temperature, apparent temperature, relative humidity, precipitation, wind speed, wind gusts, weather interpretation codes).
   - Terms: Non-commercial open access under [CC BY 4.0](https://open-meteo.com/).
   - Clearly labeled as numerical model forecasts (ECMWF/GFS), not direct ground sensors.

3. **Cartography & Basemap**
   - **MapLibre GL JS** with **OpenFreeMap Dark Style**.
   - Vector tiles derived from OpenStreetMap contributors under ODbL.

---

## 🤖 Gemini 3.1 Flash-Lite Copilot Implementation

The AI Earth Copilot is built with strict safety and scientific integrity guardrails:

### Strict JSON Action Contract (`MapIntent`)
```typescript
type MapIntent = {
  action: 'filter_earthquakes' | 'focus_region' | 'show_top_events' | 'select_layer' | 'inspect_weather' | 'explain_selected_event' | 'clear_filters';
  timeRange?: '1h' | '24h' | '7d' | '30d';
  minMagnitude?: number;
  region?: string;
  topN?: number;
  layer?: 'earthquakes' | 'weather' | 'both';
  explanation?: string;
};
```

### Integrity & Safety Guardrails
- **Deterministic Statistics:** The AI model is never allowed to fabricate earthquake counts, rankings, or magnitudes. All statistics (averages, distributions, depth classifications) are calculated client-side in TypeScript from actual filtered records.
- **No Speculative Predictions:** TerraPulse explicitly disclaims earthquake predictions and rejects unsupported causal relationships between weather and seismic events.
- **Quota & Offline Resilience:** When running without an API key or when the Google Free Tier quota resets, the application seamlessly utilizes an internal deterministic action parser that mirrors the identical MapIntent schema offline.
- **Secret Protection:** No API keys are ever committed to Git, bundled into static JavaScript, or exposed in public S3 files. Keys are managed privately via browser `localStorage` or server proxy.

---

## 🚀 Local Setup & Development

### Prerequisites
- Node.js 18+ (tested on Node v22)
- npm 9+

### Quickstart
```bash
# 1. Clone repository
git clone https://github.com/your-username/terrapulse.git
cd terrapulse

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
This produces a self-contained, optimized static output in `dist/`.

---

## ☁️ AWS S3 Deployment Guide (Learner Lab Verified)

### Option A: AWS CLI Deployment
```bash
# Set your bucket name
BUCKET_NAME="terrapulse-map-it-2026"

# 1. Create S3 Bucket (if not created)
aws s3 mb s3://$BUCKET_NAME --region us-east-1

# 2. Enable Static Website Hosting
aws s3 website s3://$BUCKET_NAME/ --index-document index.html --error-document index.html

# 3. Set Bucket Public Read Policy (if allowed by lab policy)
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
    }
  ]
}'

# 4. Upload production build
aws s3 sync dist/ s3://$BUCKET_NAME/ --delete

# 5. Access your live application
echo "Endpoint: http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
```

### Option B: AWS Management Console
1. Navigate to **S3** in the AWS Console.
2. Click **Create Bucket**, name it (e.g. `terrapulse-map-it`), choose region, and uncheck *Block Public Access* (if permitted in your lab).
3. Under **Properties**, enable **Static website hosting** with Index document `index.html`.
4. Upload all files from the `dist/` directory directly to the bucket root.
5. Open the provided Static Website Endpoint URL in an incognito window.

---

## 🎬 3-Minute Demo Video Storyboard

| Timestamp | Screen Action | Voiceover / Narrative |
| :--- | :--- | :--- |
| **0:00 - 0:20** | Live global map on screen with live status pill. | "Welcome to TerraPulse, a map-first global earth intelligence system built on AWS for the Weekend Challenge: Map It." |
| **0:20 - 0:50** | Interacting with Left Rail: time window (24h to 7d), magnitude slider (M4.5+), clicking an event marker. | "TerraPulse streams authoritative USGS earthquake feeds directly into MapLibre GL. Selecting an epicenter reveals focal depth, magnitude, and canonical USGS links." |
| **0:50 - 1:20** | Clicking map location / epicenter to open Weather profile. | "By clicking any point, TerraPulse fetches Open-Meteo atmospheric telemetry and a 24-hour forecast to contextualize the local surface conditions." |
| **1:20 - 2:10** | Opening AI Copilot drawer; typing "Show magnitude 4+ earthquakes from the last 7 days around Japan and highlight the strongest five." | "The Gemini 3.1 Flash-Lite copilot translates natural questions into validated MapIntents. Watch the camera smoothly focus on the Japan Trench and highlight the top 5 seismic events." |
| **2:10 - 2:35** | Showing bottom telemetry rail with calculated distributions and no hallucinated numbers. | "All analytics in the telemetry strip are computed deterministically in code from actual filtered records, preserving scientific truth." |
| **2:35 - 3:00** | Showing Amazon S3 hosting architecture and Builder Center write-up summary. | "TerraPulse is deployed directly to Amazon S3 static website hosting, providing a low-cost, high-performance architecture. Check out the code and live demo." |

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
