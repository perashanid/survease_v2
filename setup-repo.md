# GitHub Repository Setup Guide

## Current Situation
Your local repository is currently pointing to: `https://github.com/perashanid/diabetes_prediction_with_tensordflow.git`

## Option 1: Update Remote to Survey Platform Repository

If you want to use an existing GitHub repository for your survey platform:

```bash
# Remove current remote
git remote remove origin

# Add your survey platform repository
git remote add origin https://github.com/yourusername/your-survey-repo.git

# Verify the remote
git remote -v
```

## Option 2: Create New Repository

1. **Go to GitHub.com and create a new repository**
   - Repository name: `survey-platform` or `survease`
   - Make it private (recommended for security)
   - Don't initialize with README (we have files already)

2. **Update remote to new repository:**
```bash
# Remove current remote
git remote remove origin

# Add new repository (replace with your actual repo URL)
git remote add origin https://github.com/yourusername/survey-platform.git
```

## Step 3: Prepare and Push Files

```bash
# Add only survey platform files
git add api/
git add backend/
git add frontend/
git add package.json
git add package-lock.json
git add render.yaml
git add DEPLOYMENT.md
git add SECURITY.md
git add env.example
git add .gitignore

# Commit the files
git commit -m "Initial commit: Survey Platform MERN application

- Backend API with Express.js and MongoDB
- Frontend React application with Vite
- Authentication system with JWT
- Survey creation and response system
- Private survey invitations
- Production-ready deployment configuration
- Security best practices implemented"

# Push to GitHub
git push -u origin main
```

## Step 4: Set Up Deployment

After pushing to GitHub:

1. **Go to Render.com**
2. **Connect your GitHub repository**
3. **Create two services:**
   - Web Service (Backend API)
   - Static Site (Frontend)
4. **Set environment variables** (see DEPLOYMENT.md)

## Important Security Notes

- ✅ Real credentials are NOT in the code
- ✅ Environment variables must be set in Render dashboard
- ✅ .env files are gitignored
- ✅ MongoDB URI is secure

## Verification

After setup, verify:
- [ ] Repository shows only survey platform files
- [ ] No sensitive data in commits
- [ ] .env files are not tracked
- [ ] Remote points to correct repository