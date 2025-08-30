# Deployment Guide

This guide covers deploying the Survey Platform to Vercel with a serverless backend and static frontend.

## Prerequisites

- Vercel account
- MongoDB Atlas database
- GitHub repository
- Node.js 18+ locally

## MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free account
   - Create a new cluster

2. **Configure Database Access**
   - Go to Database Access
   - Create a database user with read/write permissions
   - Note down the username and password

3. **Configure Network Access**
   - Go to Network Access
   - Add IP Address: `0.0.0.0/0` (allows access from anywhere)
   - Or add specific Vercel IP ranges if preferred

4. **Get Connection String**
   - Go to Clusters → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database user password

## Vercel Deployment

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from project root**
   ```bash
   cd survey-platform
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? `Y`
   - Which scope? Select your account
   - Link to existing project? `N` (for first deployment)
   - What's your project's name? `survey-platform` (or your preferred name)
   - In which directory is your code located? `./`

### Method 2: GitHub Integration

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure project settings (see below)

## Environment Variables

Set these environment variables in your Vercel project settings:

### Required Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/survey-platform

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=7d

# Environment
NODE_ENV=production

# Frontend URL (replace with your actual Vercel domain)
FRONTEND_URL=https://your-project-name.vercel.app

# API URL for frontend
VITE_API_BASE_URL=https://your-project-name.vercel.app/api
```

### Setting Environment Variables

#### Via Vercel Dashboard
1. Go to your project in Vercel Dashboard
2. Go to Settings → Environment Variables
3. Add each variable with its value
4. Set environment to "Production" (and "Preview" if needed)

#### Via Vercel CLI
```bash
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add NODE_ENV
vercel env add FRONTEND_URL
vercel env add VITE_API_BASE_URL
```

## Project Configuration

### vercel.json Configuration

The project includes a `vercel.json` file that configures:
- Backend build from `backend/package.json`
- Frontend build from `frontend/package.json`
- API routes to `/api/*`
- Static file serving for frontend

### Build Configuration

#### Backend Build
- Runs `npm run vercel-build` which executes `tsc` to compile TypeScript
- Outputs to `backend/dist/`

#### Frontend Build
- Runs `npm run vercel-build` which executes `tsc && vite build`
- Outputs to `frontend/dist/`

## Domain Configuration

### Custom Domain (Optional)

1. **Add Custom Domain**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update Environment Variables**
   - Update `FRONTEND_URL` to your custom domain
   - Update `VITE_API_BASE_URL` to your custom domain + `/api`

3. **Update CORS Configuration**
   - Update `backend/src/app.ts` CORS settings with your domain

## Post-Deployment Checklist

### 1. Verify Deployment
- [ ] Frontend loads correctly
- [ ] API endpoints respond (check `/api/health`)
- [ ] Database connection works
- [ ] Authentication works (register/login)

### 2. Test Core Features
- [ ] User registration and login
- [ ] Survey creation
- [ ] Survey response submission
- [ ] Analytics display
- [ ] Data export functionality
- [ ] Private survey invitations

### 3. Performance Optimization
- [ ] Check Vercel function logs for errors
- [ ] Monitor database connection performance
- [ ] Verify static asset loading

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```
Error: MongoNetworkError: connection timed out
```
**Solution:**
- Check MongoDB Atlas network access settings
- Verify connection string format
- Ensure database user has correct permissions

#### 2. Environment Variable Issues
```
Error: JWT_SECRET is not defined
```
**Solution:**
- Verify all environment variables are set in Vercel
- Redeploy after adding missing variables
- Check variable names for typos

#### 3. CORS Errors
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```
**Solution:**
- Update CORS configuration in `backend/src/app.ts`
- Add your production domain to allowed origins
- Redeploy backend

#### 4. Build Errors
```
Error: Cannot find module 'uuid'
```
**Solution:**
- Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify
- Check for missing TypeScript types

### Debugging Steps

1. **Check Vercel Function Logs**
   ```bash
   vercel logs
   ```

2. **Test API Endpoints**
   ```bash
   curl https://your-domain.vercel.app/api/health
   ```

3. **Verify Environment Variables**
   ```bash
   vercel env ls
   ```

## Monitoring and Maintenance

### Performance Monitoring
- Use Vercel Analytics for frontend performance
- Monitor API response times
- Check database performance in MongoDB Atlas

### Regular Maintenance
- Update dependencies regularly
- Monitor error logs
- Backup database regularly
- Review and rotate JWT secrets

### Scaling Considerations
- Monitor Vercel function execution time
- Consider database indexing for better performance
- Implement caching strategies if needed

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong, unique JWT secrets
   - Rotate secrets regularly

2. **Database Security**
   - Use strong database passwords
   - Limit network access when possible
   - Enable MongoDB Atlas security features

3. **API Security**
   - Keep dependencies updated
   - Monitor for security vulnerabilities
   - Implement rate limiting (already included)

## Support

For deployment issues:
1. Check Vercel documentation
2. Review MongoDB Atlas documentation
3. Create an issue in the project repository
4. Check Vercel community forums