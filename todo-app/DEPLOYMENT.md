# Deployment Guide

## Pre-Deployment Checklist

### ✅ Completed

- [x] Production build passes with zero warnings
- [x] Environment validation on server start
- [x] CORS configured for production
- [x] Rate limiting enabled
- [x] Graceful shutdown handling
- [x] Global error handling
- [x] Health check endpoint (`/api/health`)
- [x] Removed exposed API keys from `.env`
- [x] Removed test files (`test-functionality.js`)
- [x] Code splitting and bundle optimization

### 🔧 Before Deployment

1. **Backend Environment Variables** (set in deployment platform):

   ```
   MONGODB_URI=<your-production-mongodb-uri>
   JWT_SECRET=<generate-secure-32+-char-secret>
   JWT_EXPIRES_IN=7d
   PORT=5000
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-url.vercel.app
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

2. **Frontend Environment Variables** (set in deployment platform):
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   VITE_APP_NAME=Student Study Planner
   VITE_APP_VERSION=1.0.0
   ```

## Deployment Steps

### Backend (Render/Railway)

1. Create new Web Service
2. Connect GitHub repository
3. Set root directory: `todo-app/backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables from checklist above
7. Deploy

### Frontend (Vercel/Netlify)

1. Create new project
2. Connect GitHub repository
3. Set root directory: `todo-app`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment variables
7. Deploy

## Post-Deployment Verification

1. **Health Check**: `GET https://your-backend-url/api/health`
2. **CORS Test**: Frontend can make API calls
3. **Auth Flow**: Register → Login → Logout
4. **Task CRUD**: Create, Read, Update, Delete tasks
5. **Analytics**: Dashboard loads with data

## Rollback

If issues occur:

1. Revert to previous deployment in platform dashboard
2. Check logs for errors
3. Verify environment variables are correct

## Security Notes

- JWT_SECRET must be unique and secure (use `openssl rand -base64 32`)
- Never commit `.env` files with real secrets
- MongoDB URI should use a dedicated production database
- Enable MongoDB IP whitelist for production
