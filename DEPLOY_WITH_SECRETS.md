# Deploying with Supabase Credentials

## Quick Deployment Command

Run this command from your local machine (replace with your actual values):

```bash
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions=_VITE_SUPABASE_URL="https://iefcremzlaaauhapqhim.supabase.co",_VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllZmNyZW16bGFhYXVoYXBxaGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDIxOTEsImV4cCI6MjA4NTUxODE5MX0.CiceBaHMNGzdKZqzB2Ey7-MzHq1lEk5HGWE8HdsFHnI"
```

## Better Option: Using Google Secret Manager (Recommended for Production)

### 1. Store secrets in Secret Manager:

```bash
# Store Supabase URL
echo -n "https://iefcremzlaaauhapqhim.supabase.co" | \
  gcloud secrets create supabase-url --data-file=-

# Store Supabase Anon Key
echo -n "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllZmNyZW16bGFhYXVoYXBxaGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDIxOTEsImV4cCI6MjA4NTUxODE5MX0.CiceBaHMNGzdKZqzB2Ey7-MzHq1lEk5HGWE8HdsFHnI" | \
  gcloud secrets create supabase-anon-key --data-file=-
```

### 2. Grant Cloud Build access to secrets:

```bash
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding supabase-url \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding supabase-anon-key \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Update `cloudbuild.yaml` to use secrets:

```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: 
      - 'build'
      - '--no-cache'
      - '--build-arg'
      - 'VITE_SUPABASE_URL=$$SUPABASE_URL'
      - '--build-arg'
      - 'VITE_SUPABASE_ANON_KEY=$$SUPABASE_ANON_KEY'
      - '-t'
      - 'gcr.io/$PROJECT_ID/aman-cement-crm'
      - '.'
    secretEnv: ['SUPABASE_URL', 'SUPABASE_ANON_KEY']

  # ... rest of steps

availableSecrets:
  secretManager:
  - versionName: projects/$PROJECT_ID/secrets/supabase-url/versions/latest
    env: 'SUPABASE_URL'
  - versionName: projects/$PROJECT_ID/secrets/supabase-anon-key/versions/latest
    env: 'SUPABASE_ANON_KEY'
```

### 4. Deploy:

```bash
gcloud builds submit --config cloudbuild.yaml
```

## For Cloud Build Triggers

If using triggers, add the substitution variables in the trigger configuration:

1. Go to Cloud Build → Triggers
2. Edit your trigger
3. Add substitution variables:
   - `_VITE_SUPABASE_URL` = your URL
   - `_VITE_SUPABASE_ANON_KEY` = your key
