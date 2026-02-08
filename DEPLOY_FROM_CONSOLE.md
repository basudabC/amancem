# Deploying from Google Cloud Console

## Option 1: Using Cloud Shell (Recommended - Easiest)

1. **Open Google Cloud Console**: Go to [console.cloud.google.com](https://console.cloud.google.com)

2. **Activate Cloud Shell**: Click the `>_` icon in the top-right corner

3. **Upload your code** (if not already in a Git repo):
   - Click the ⋮ (three dots) menu in Cloud Shell
   - Select "Upload file" or "Upload folder"
   - Upload your entire `app` folder

4. **Run the build**:
   ```bash
   cd app
   gcloud builds submit --config cloudbuild.yaml
   ```

5. **Wait for completion**: The build will take 5-10 minutes. You'll see the progress in the terminal.

## Option 2: Using Cloud Build Triggers (Best for CI/CD)

1. **Push to Git Repository** (if not done already):
   - Create a repo on GitHub/GitLab/Bitbucket
   - Push your code:
     ```bash
     git add .
     git commit -m "Deploy to Cloud Run"
     git push origin main
     ```

2. **Set up Cloud Build Trigger**:
   - Go to **Cloud Build** → **Triggers** in Google Cloud Console
   - Click **+ CREATE TRIGGER**
   - Configure:
     - **Name**: `deploy-aman-cement-crm`
     - **Event**: Push to a branch
     - **Source**: Connect your repository
     - **Branch**: `^main$`
     - **Configuration**: Cloud Build configuration file (yaml or json)
     - **Location**: `app/cloudbuild.yaml`
   - Click **CREATE**

3. **Trigger the Build**:
   - Push any change to your main branch, OR
   - Click **RUN** on the trigger manually

## Option 3: Direct gcloud Command (From Your Local Machine)

If you have `gcloud` CLI installed locally:

```bash
cd "c:\Users\Victus1\Downloads\Kimi_Agent_Aman Cement CRMv2\app"
gcloud builds submit --config cloudbuild.yaml
```

## After Deployment

Once the build completes successfully, you'll get a Cloud Run URL like:
`https://aman-cement-crm-XXXXXX-as.a.run.app`

You can find it in the **Cloud Run** section of the console.

## Troubleshooting

- **If build fails**: Check the logs in Cloud Build → History
- **If deployment succeeds but app doesn't work**: Check Cloud Run logs
- **Environment Variables**: If you need to set Supabase keys, go to Cloud Run → Select your service → Edit & Deploy New Revision → Variables & Secrets
