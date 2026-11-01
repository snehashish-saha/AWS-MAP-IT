# ☁️ TerraPulse SUBSEA — AWS Serverless Backend Pipeline

This directory contains the Infrastructure as Code (IaC) and Lambda source code powering the automated USGS earthquake ingestion pipeline and Amazon S3 + CloudFront caching tier for TerraPulse SUBSEA.

---

## 🏛 Serverless Architecture Overview

```
                                    +-----------------------+
                                    |  USGS Hazards API     |
                                    |  (all_day.geojson)    |
                                    +-----------+-----------+
                                                |
                                                v (HTTPS GET every 5 min)
+-----------------------+           +-----------------------+
| Amazon EventBridge    | --------> | AWS Lambda Function   |
| Scheduler (rate 5m)   |  Trigger  | (Python 3.12 / ARM64) |
+-----------------------+           +-----------+-----------+
                                                |
                                                v (put_object)
                                    +-----------------------+
                                    | Amazon S3             |
                                    | (GeoJSON Cache Bucket)|
                                    +-----------+-----------+
                                                |
                                                v (Origin Access Control)
                                    +-----------------------+
                                    | Amazon CloudFront     |
                                    | Global Edge CDN       |
                                    +-----------+-----------+
                                                |
                                                v
                                    +-----------------------+
                                    | TerraPulse Web App    |
                                    | (MapLibre + React 19) |
                                    +-----------------------+
```

---

## 📁 Directory Structure

```
backend/
├── lambda/
│   └── lambda_function.py   # Python 3.12 ingestion handler (zero external pip dependencies)
├── template.yaml            # AWS SAM / CloudFormation template
└── README.md                # Deployment and architecture guide
```

---

## 🚀 Deployment Instructions

### Prerequisites
1. [AWS CLI](https://aws.amazon.com/cli/) configured (`aws configure`).
2. [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) installed.

### Step 1: Build the SAM Application
```bash
sam build
```

### Step 2: Deploy to AWS
```bash
sam deploy --guided
```

You will be prompted for:
- **Stack Name:** `terrapulse-subsea-backend`
- **AWS Region:** e.g., `us-east-1`
- **Environment:** `prod`
- Confirm IAM role creation.

### Step 3: Deploy Frontend Build to the S3 Bucket
Once deployment completes, the SAM outputs will print the S3 Bucket Name and CloudFront Domain Name:
```bash
# In the root repository directory:
npm run build
aws s3 sync dist/ s3://<S3BucketName>/ --delete
aws cloudfront create-invalidation --distribution-id <CloudFrontDistributionId> --paths "/*"
```
