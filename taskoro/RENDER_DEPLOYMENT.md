# Deploy Taskoro to Render (Free)

This guide will help you deploy your Taskoro app to Render's free tier.

## Prerequisites

1. **GitHub Account** - Your code needs to be on GitHub
2. **Google Cloud Console Account** - For Calendar API
3. **Render Account** - Sign up at [render.com](https://render.com)

## Step 1: Push Your Code to GitHub

If you haven't already:

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/yourusername/taskoro.git
git push -u origin main
```

## Step 2: Set Up Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the **Google Calendar API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `https://your-app-name.onrender.com/calendar/callback`
     - (Replace `your-app-name` with your actual app name)

5. **Save your credentials** - you'll need:
   - Client ID
   - Client Secret

## Step 3: Deploy to Render

### Option A: Using Render Blueprint (Recommended)

1. **Sign up/Login** to [render.com](https://render.com)

2. **Create New Blueprint**:
   - Click "New" > "Blueprint"
   - Connect your GitHub repository
   - Render will detect the `render.yaml` file

3. **Configure Environment Variables**:
   - `FRONTEND_URL`: `https://your-frontend-name.onrender.com`
   - `GOOGLE_CLIENT_ID`: Your Google Client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google Client Secret
   - `GOOGLE_REDIRECT_URI`: `https://your-frontend-name.onrender.com/calendar/callback`

4. **Deploy**: Click "Apply" and wait for deployment

### Option B: Manual Setup

#### Deploy the Backend (API):

1. **Create Web Service**:
   - Click "New" > "Web Service"
   - Connect your GitHub repo
   - Configure:
     - **Name**: `taskoro-api`
     - **Environment**: `Node`
     - **Build Command**: `npm run render:build`
     - **Start Command**: `npm run render:start`

2. **Add Environment Variables**:

   ```
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-name.onrender.com
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_REDIRECT_URI=https://your-frontend-name.onrender.com/calendar/callback
   ```

3. **Create PostgreSQL Database**:
   - Click "New" > "PostgreSQL"
   - Name: `taskoro-db`
   - Plan: Free
   - Copy the connection string

4. **Add Database URL** to your web service:
   - `DATABASE_URL=your-postgres-connection-string`

#### Deploy the Frontend:

1. **Create Static Site**:
   - Click "New" > "Static Site"
   - Connect same GitHub repo
   - Configure:
     - **Name**: `taskoro-frontend`
     - **Build Command**: `npm ci && npm run build`
     - **Publish Directory**: `dist`

2. **Add Environment Variable**:
   ```
   VITE_API_URL=https://your-api-name.onrender.com
   ```

## Step 4: Update Your Frontend Code

You need to configure your frontend to use the API URL. Update your API service:

```typescript
// src/services/api.ts (create if doesn't exist)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
```

Make sure all your API calls use this base URL.

## Step 5: Test Your Deployment

1. **Check API Health**:
   - Visit: `https://your-api-name.onrender.com/health`
   - Should return: `{"status":"OK","timestamp":"..."}`

2. **Test Frontend**:
   - Visit: `https://your-frontend-name.onrender.com`
   - Try registering a new account
   - Test creating tasks
   - Test Google Calendar integration

## Important Notes

### Free Tier Limitations:

- **Sleep Mode**: Services sleep after 15 minutes of inactivity
- **Cold Starts**: First request after sleep takes ~30 seconds
- **Database**: 1GB storage limit
- **Bandwidth**: 100GB/month

### Custom Domain (Optional):

- You can add a custom domain in Render dashboard
- Update your Google OAuth redirect URIs accordingly

## Troubleshooting

### Common Issues:

**1. Build Fails**

```bash
# Check build logs in Render dashboard
# Common fix: ensure all dependencies are in package.json
```

**2. Database Connection Issues**

```bash
# Verify DATABASE_URL is set correctly
# Check if database is in same region as web service
```

**3. Google OAuth Errors**

```bash
# Verify redirect URIs match exactly
# Check that Calendar API is enabled
# Ensure credentials are for "Web application" type
```

**4. CORS Errors**

```bash
# Verify FRONTEND_URL matches your frontend domain
# Check that withCredentials is set in axios
```

### Getting Help:

- Check Render logs in the dashboard
- Render has great documentation and community support
- GitHub issues for this project

## Updating Your App

To deploy updates:

1. Push changes to GitHub:

   ```bash
   git add .
   git commit -m "Update description"
   git push
   ```

2. Render will automatically redeploy both services

## Cost Optimization

The free tier should be sufficient for development and small-scale use. If you need more:

- **Starter Plan** ($7/month): No sleep, faster builds
- **Pro Plan** ($25/month): More resources, priority support

Your app is now live and accessible to anyone on the internet! 🎉
