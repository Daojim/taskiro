# Quick Render Deployment Guide for Taskoro

Your app is already configured for Render! Here's exactly what you need to do:

## Step 1: Get Your Code on GitHub

```bash
# If you haven't already, push your code to GitHub
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

## Step 2: Set Up Google Calendar API (5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable Google Calendar API:
   - Search "Google Calendar API" in the library
   - Click "Enable"
4. Create credentials:
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add redirect URI: `https://YOUR-APP-NAME.onrender.com/calendar/callback`
   - **Save the Client ID and Client Secret!**

## Step 3: Deploy to Render (10 minutes)

### Deploy Backend (API):

1. Go to [render.com](https://render.com) and sign up
2. Click "New" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Name**: `taskoro-api` (or whatever you prefer)
   - **Environment**: Node
   - **Build Command**: `npm run render:build`
   - **Start Command**: `npm run render:start`

5. **Add Environment Variables**:

   ```
   NODE_ENV=production
   FRONTEND_URL=https://YOUR-FRONTEND-NAME.onrender.com
   GOOGLE_CLIENT_ID=your-google-client-id-here
   GOOGLE_CLIENT_SECRET=your-google-client-secret-here
   GOOGLE_REDIRECT_URI=https://YOUR-FRONTEND-NAME.onrender.com/calendar/callback
   ```

6. **Create Database**:
   - Click "New" → "PostgreSQL"
   - Name: `taskoro-db`
   - Copy the connection string
   - Add to your web service: `DATABASE_URL=your-connection-string`

### Deploy Frontend:

1. Click "New" → "Static Site"
2. Connect same GitHub repo
3. Configure:
   - **Name**: `taskoro-frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `dist`

4. **Add Environment Variable**:
   ```
   VITE_API_URL=https://your-api-name.onrender.com
   ```

## Step 4: Update Google OAuth

Go back to Google Cloud Console and update your OAuth redirect URI with the actual frontend URL.

## Step 5: Test It!

- Visit your frontend URL
- Try creating an account
- Create a task
- Test Google Calendar sync

## That's It! 🎉

Your app is now live on the internet for free!

### Important Notes:

- **Free tier sleeps** after 15 minutes of inactivity
- **First request** after sleep takes ~30 seconds to wake up
- **Perfect for development** and showing off your project

### If Something Goes Wrong:

1. Check the logs in Render dashboard
2. Make sure all environment variables are set
3. Verify your Google OAuth settings match your URLs

Your Taskoro app should now be accessible to anyone on the internet!
