# Backend Deployment Guide

## Railway Deployment (Recommended)

### 1. Setup Railway Account
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

### 2. Deploy Backend
```bash
cd backend
railway init
railway up
```

### 3. Set Environment Variables in Railway Dashboard
```env
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret
FRONTEND_URL=https://fantaiuto.netlify.app
DATABASE_PATH=./database/fantaaiuto.db
```

### 4. Get Backend URL
After deployment, Railway will provide a URL like:
`https://fantaaiuto-backend-production.up.railway.app`

### 5. Update Frontend Configuration
Update `src/config/environment.js`:
```javascript
BACKEND_URL: 'https://your-railway-app.up.railway.app'
```

Then redeploy frontend:
```bash
npm run build
git add . && git commit -m "Update backend URL for production"
git push
```

## Alternative: Render Deployment

### 1. Create Render Account
Go to https://render.com

### 2. Deploy from GitHub
- Connect your GitHub repo
- Select `backend` folder as root directory
- Set build command: `npm install`
- Set start command: `npm start`

### 3. Environment Variables
Set in Render dashboard:
```env
NODE_ENV=production
JWT_SECRET=your-secure-secret
FRONTEND_URL=https://fantaiuto.netlify.app
```

## Manual Backend Deployment Steps

1. **Deploy Backend to Cloud Service**
2. **Update Frontend Config** with backend URL
3. **Redeploy Frontend** to Netlify
4. **Test Integration** between frontend and backend

## Current Status

✅ Frontend: Deployed on Netlify (offline mode working)
⏳ Backend: Ready for deployment (locally functional)
📋 Database: SQLite included in backend
🔐 Authentication: Ready for multi-user use