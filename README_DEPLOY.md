# Deploying to Google Cloud Run

This guide explains how to deploy the Aman Cement CRM application to Google Cloud Run using the provided Docker configuration.

## Prerequisites

1.  **Google Cloud SDK**: Ensure `gcloud` CLI is installed and authenticated.
2.  **Project ID**: You must have a Google Cloud Project created.

## Option 1: Manual Deployment (Using Cloud Build)

Run the following command in your terminal (replace `YOUR_PROJECT_ID` with your actual project ID):

```powershell
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/aman-cement-crm .
```

After the build is successful, deploy to Cloud Run:

```powershell
gcloud run deploy aman-cement-crm --image gcr.io/YOUR_PROJECT_ID/aman-cement-crm --platform managed --region asia-southeast1 --allow-unauthenticated
```
...
