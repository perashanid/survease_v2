# Deployment Guide

## Production Deployment on Render

### Prerequisites
- GitHub repository with your code
- Render account
- MongoDB Atlas database

### Environment Variables Setup

#### 🔒 Security First!
**NEVER commit real credentials to version control!**
Set these as environment variables in Render Dashboard only.

#### Backend Environment Variables (Set in Render Dashboard)
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/survey_platform
JWT_SECRET=your_secure_32_plus_character_random_string
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://survease-frontend.onrender.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EMAIL_USER=your_production_email@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_FROM=noreply@yourdomain.com
CONTACT_EMAIL=support@yourdomain.com
SEND_AUTO_REPLY=false
```

#### 🛡️ Generate Secure JWT Secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Frontend Environment Variables (Set in Render Dashboard)
```
VITE_API_BASE_URL=https://survease-backend.onrender.com
VITE_WS_URL=wss://survease-backend.onrender.com
VITE_APP_NAME=Survey Platform
VITE_APP_VERSION=1.0.0
```

### Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy ready configuration"
   git push origin main
   ```

2. **Deploy Backend (API Service)**
   - Go to Render Dashboard
   - Create new "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Name: `survease-backend`
     - Environment: `Node`
     - Build Command: `cd backend && npm install && npm run build`
     - Start Command: `cd backend && npm start`
     - Add all backend environment variables

3. **Deploy Frontend (Static Site)**
   - Create new "Static Site"
   - Connect same GitHub repository
   - Configure:
     - Name: `survease-frontend`
     - Build Command: `cd frontend && npm install && npm run build`
     - Publish Directory: `frontend/dist`
     - Add all frontend environment variables

### Post-Deployment Checklist

- [ ] Backend API is accessible at `https://survease-backend.onrender.com/health`
- [ ] Frontend loads at `https://survease-frontend.onrender.com`
- [ ] Database connection is working
- [ ] Authentication system works
- [ ] Survey creation and responses work
- [ ] Private survey links point to frontend correctly
- [ ] Email notifications work (if configured)

### Troubleshooting

#### Common Issues:
1. **Build Failures**: Check build logs in Render dashboard
2. **Environment Variables**: Ensure all required vars are set
3. **Database Connection**: Verify MongoDB URI and network access
4. **CORS Issues**: Check FRONTEND_URL matches actual frontend domain

#### Logs:
- Backend logs: Available in Render service dashboard
- Frontend: Check browser console for errors

### Local Testing with Production Config

```bash
# Test backend with production env
cd backend
cp .env.production .env
npm run build
npm start

# Test frontend with production env
cd frontend
cp .env.production .env
npm run build
npm run preview
```

### Security Notes
- JWT_SECRET should be a strong, unique value in production
- MongoDB URI should use a production database
- Email credentials should be secure app passwords
- Consider enabling additional security headers