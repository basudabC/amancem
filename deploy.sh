#!/bin/bash
# Deploy Aman Cement CRM to Google Cloud Run
# This script builds and deploys with Supabase credentials embedded

# Your Supabase credentials (from .env file)
SUPABASE_URL="https://iefcremzlaaauhapqhim.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllZmNyZW16bGFhYXVoYXBxaGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDIxOTEsImV4cCI6MjA4NTUxODE5MX0.CiceBaHMNGzdKZqzB2Ey7-MzHq1lEk5HGWE8HdsFHnI"

echo "🚀 Deploying Aman Cement CRM to Google Cloud Run..."
echo "📦 Building with Supabase credentials embedded..."

gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions=_VITE_SUPABASE_URL="${SUPABASE_URL}",_VITE_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"

echo "✅ Deployment complete!"
echo "🌐 Your app will be available at the Cloud Run URL shown above"
