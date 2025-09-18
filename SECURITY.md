# Security Configuration Guide

## 🔒 Environment Variables Security

### ⚠️ IMPORTANT: Never commit sensitive data to version control!

## Local Development Setup

1. **Copy the example environment file:**
   ```bash
   cp env.example backend/.env
   ```

2. **Update with your actual credentials:**
   ```bash
   # Edit backend/.env with your real values
   MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/survey_platform
   JWT_SECRET=your_super_secure_random_string_here
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_specific_password
   ```

## Production Deployment Security

### 1. **Render Environment Variables**
Set these in your Render service dashboard (NOT in code):

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/survey_platform
JWT_SECRET=your_production_jwt_secret_minimum_32_characters
EMAIL_USER=your_production_email@domain.com
EMAIL_PASS=your_production_email_app_password
CONTACT_EMAIL=support@yourdomain.com
```

### 2. **Generate Secure JWT Secret**
```bash
# Generate a secure random string (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. **MongoDB Security Checklist**
- [ ] Use MongoDB Atlas (cloud) for production
- [ ] Enable IP whitelisting (add Render's IPs)
- [ ] Use strong database passwords
- [ ] Create separate databases for dev/staging/production
- [ ] Enable database authentication
- [ ] Regular backup schedule

### 4. **Email Security**
- [ ] Use app-specific passwords (not your main password)
- [ ] Enable 2FA on email accounts
- [ ] Use dedicated email service (SendGrid, Mailgun) for production
- [ ] Limit email rate limits

## Security Best Practices

### 1. **Environment Files**
```bash
# ✅ Good - These files are gitignored
backend/.env
frontend/.env
backend/.env.production
frontend/.env.production

# ❌ Bad - Never commit these
backend/.env.example  # This is OK - no real credentials
```

### 2. **Credential Rotation**
- Rotate JWT secrets regularly
- Update database passwords quarterly
- Monitor for credential leaks

### 3. **Access Control**
- Limit database user permissions
- Use read-only users where possible
- Monitor database access logs

## Emergency Response

### If Credentials Are Compromised:
1. **Immediately rotate all affected credentials**
2. **Update environment variables on all platforms**
3. **Check access logs for unauthorized usage**
4. **Consider temporary service shutdown if needed**

## Verification Checklist

Before deploying:
- [ ] No hardcoded credentials in source code
- [ ] All .env files are gitignored
- [ ] Production uses different credentials than development
- [ ] JWT secret is 32+ characters and random
- [ ] Database has proper access controls
- [ ] Email uses app-specific passwords

## Contact

If you discover a security vulnerability, please report it immediately to your security team or project maintainer.