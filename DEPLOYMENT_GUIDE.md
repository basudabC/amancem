# Aman Cement CRM - Cloud Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Google Maps API Setup](#google-maps-api-setup)
4. [Deployment Options](#deployment-options)
   - [Option 1: Vercel (Recommended)](#option-1-vercel-recommended)
   - [Option 2: Netlify](#option-2-netlify)
   - [Option 3: Railway](#option-3-railway)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:
- Node.js 18+ installed locally
- Git repository initialized
- Accounts on chosen deployment platform
- Supabase account
- Google Cloud account

---

## Supabase Setup

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Fill in:
   - **Organization**: Your organization name
   - **Project Name**: `aman-crm-prod` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users (e.g., `Southeast Asia (Singapore)`)
4. Click "Create new project" (takes ~2 minutes)

### Step 2: Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL Editor
5. Click **Run** (this creates all tables, RLS policies, and sample data)

### Step 3: Get API Credentials

1. Go to **Project Settings** (gear icon)
2. Click **API** in the sidebar
3. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### Step 4: Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure settings:
   - Confirm email: OFF (for easier testing, enable in production)
   - Secure email change: ON
   - Mailer OTP Expiration: 3600

### Step 5: Create Admin User

1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter:
   - Email: `admin@aman-cement.com`
   - Password: Strong password
4. Click **Create user**
5. In SQL Editor, run:
   ```sql
   UPDATE profiles 
   SET role = 'country_head',
       full_name = 'System Administrator',
       employee_code = 'ADMIN-001'
   WHERE email = 'admin@aman-cement.com';
   ```

---

## Google Maps API Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click project selector → **New Project**
3. Name: `aman-crm-maps`
4. Click **Create**

### Step 2: Enable Billing

1. Go to **Billing** → **Link a billing account**
2. Set up payment method (required for Maps API)
3. Google provides $200/month free tier

### Step 3: Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Search and enable:
   - ✅ **Maps JavaScript API**
   - ✅ **Geocoding API** (optional, for address conversion)

### Step 4: Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the key → `VITE_GOOGLE_MAPS_API_KEY`
4. Click **Restrict Key** (recommended for security):
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: Add your production domain
   - **API restrictions**: Maps JavaScript API, Geocoding API

---

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel offers the best performance for React apps with automatic deployments.

#### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

#### Step 2: Deploy
```bash
# From your project directory
cd /mnt/okcomputer/output/app

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Step 3: Configure Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - `VITE_SUPABASE_URL` = your-supabase-url
   - `VITE_SUPABASE_ANON_KEY` = your-anon-key
   - `VITE_GOOGLE_MAPS_API_KEY` = your-maps-key

#### Step 4: Configure Build Settings

In Vercel project settings:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### Step 5: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your domain: `crm.aman-cement.com`
3. Follow DNS configuration instructions

---

### Option 2: Netlify

Great alternative with generous free tier.

#### Step 1: Install Netlify CLI
```bash
npm i -g netlify-cli
```

#### Step 2: Deploy
```bash
# From your project directory
cd /mnt/okcomputer/output/app

# Login
netlify login

# Initialize (first time only)
netlify init

# Deploy
netlify deploy --prod --dir=dist
```

#### Step 3: Configure Environment Variables

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add all VITE_ prefixed variables

#### Step 4: Configure Build Settings

In **Site settings** → **Build & deploy**:
- **Build command**: `npm run build`
- **Publish directory**: `dist`

---

### Option 3: Railway

Best if you need backend services alongside your frontend.

#### Step 1: Install Railway CLI
```bash
npm i -g @railway/cli
```

#### Step 2: Deploy
```bash
# From your project directory
cd /mnt/okcomputer/output/app

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

#### Step 3: Configure Environment Variables

```bash
railway variables set VITE_SUPABASE_URL=your-url
railway variables set VITE_SUPABASE_ANON_KEY=your-key
railway variables set VITE_GOOGLE_MAPS_API_KEY=your-key
```

#### Step 4: Configure Domain

```bash
railway domain
```

---

## Post-Deployment Configuration

### 1. Update Supabase Auth Redirect URLs

1. Go to Supabase → **Authentication** → **URL Configuration**
2. Add your production domain:
   - Site URL: `https://your-domain.com`
   - Redirect URLs: `https://your-domain.com/auth/callback`

### 2. Configure PWA Manifest

Edit `public/manifest.json`:
```json
{
  "name": "Aman Cement CRM",
  "short_name": "AmanCRM",
  "start_url": "/",
  "scope": "/",
  "display": "standalone"
}
```

### 3. Update Icons

Replace icons in `public/icons/` with your branded icons:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

### 4. Test All Features

- [ ] Login with different roles
- [ ] View territories on map
- [ ] Create a customer
- [ ] Schedule and complete a visit
- [ ] Check GPS validation
- [ ] Test offline mode (PWA)
- [ ] Verify role-based access

---

## Troubleshooting

### Issue: Map not loading

**Solution:**
1. Verify `VITE_GOOGLE_MAPS_API_KEY` is set correctly
2. Check browser console for API key errors
3. Ensure Maps JavaScript API is enabled in Google Cloud
4. Check if API key restrictions are blocking your domain

### Issue: Cannot login

**Solution:**
1. Verify Supabase credentials in environment variables
2. Check Supabase Auth settings
3. Ensure user exists in both `auth.users` and `profiles` tables
4. Check browser console for CORS errors

### Issue: Data not loading

**Solution:**
1. Verify RLS policies are working correctly
2. Check user's role and territory assignments
3. Test queries directly in Supabase SQL Editor
4. Check browser Network tab for failed requests

### Issue: PWA not installing

**Solution:**
1. Ensure manifest.json is valid
2. Check service worker is registered
3. Verify HTTPS is enabled (required for PWA)
4. Test in Chrome DevTools → Application → Manifest

### Issue: GPS check-in not working

**Solution:**
1. Ensure HTTPS (required for geolocation API)
2. Check browser location permissions
3. Verify customer has valid lat/lng coordinates
4. Check `visit_geofence_radius` setting in database

---

## Security Checklist

Before going live:

- [ ] Enable RLS on all tables
- [ ] Review all RLS policies
- [ ] Restrict Google Maps API key to your domain
- [ ] Enable email confirmation in Supabase Auth
- [ ] Set up strong passwords for admin accounts
- [ ] Configure CORS in Supabase (Settings → API → CORS)
- [ ] Enable HTTPS on your domain
- [ ] Remove test data from production

---

## Cost Estimation

### Free Tier Limits

| Service | Free Tier | Est. Monthly Cost |
|---------|-----------|-------------------|
| **Supabase** | 500MB DB, 2GB bandwidth | $0 |
| **Vercel** | 100GB bandwidth, 6000 build minutes | $0 |
| **Netlify** | 100GB bandwidth, 300 build minutes | $0 |
| **Google Maps** | $200 credit/month | $0 (under 28,000 loads) |

### Paid Tier (if limits exceeded)

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| **Supabase** | Pro | $25 |
| **Vercel** | Pro | $20 |
| **Google Maps** | Pay-as-you-go | ~$7 per 1000 loads |

---

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Google Maps API**: https://developers.google.com/maps
- **PWA Guide**: https://web.dev/progressive-web-apps/

---

## Next Steps

1. Set up monitoring (Sentry, LogRocket)
2. Configure analytics (Google Analytics, Mixpanel)
3. Set up automated backups
4. Create user documentation
5. Train your sales team
6. Collect feedback and iterate

---

**Built for Aman Cement Mills Ltd.**
