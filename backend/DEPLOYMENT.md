# Backend Deployment Guide

Choose one of the following hosting platforms to deploy the Heart Dating App backend. Each has step-by-step instructions.

## Platform Comparison

| Feature | Azure | Railway | Render |
|---------|-------|---------|--------|
| **Setup Time** | 10-15 min | 5-10 min | 10 min |
| **Free Tier** | $10/month credit | $5/month credit | Free tier available |
| **Scalability** | Excellent | Excellent | Good |
| **Always-On** | Yes | Yes | Spins down after 15 min inactivity (free) |
| **Custom Domain** | Yes | Yes | Yes |
| **Documentation** | Excellent | Good | Good |
| **Best For** | Enterprise, custom domains | Quick deployment | Development, free tier |

## Quick Choice Guide

- **Want Azure (mentioned earlier)?** → Follow [DEPLOY_AZURE.md](DEPLOY_AZURE.md)
- **Want fastest setup?** → Follow [DEPLOY_RAILWAY.md](DEPLOY_RAILWAY.md)
- **Want free tier?** → Follow [DEPLOY_RENDER.md](DEPLOY_RENDER.md)

---

## Pre-Deployment Checklist

Before deploying to ANY platform, ensure:

### 1. MongoDB Atlas Ready
- [ ] MongoDB Atlas account created
- [ ] Cluster created (free tier M0 is fine for testing)
- [ ] Database user created with strong password
- [ ] Connection string copied: `mongodb+srv://user:password@cluster.mongodb.net/database?retryWrites=true&w=majority`

### 2. Environment Variables Prepared
Copy the template below and fill in your values:

```
NODE_ENV=production
PORT=8080  (Render/Railway will set this; Azure uses static port)

MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/heart-dating?retryWrites=true&w=majority
JWT_SECRET=generate_a_random_32_character_string_here
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=StrongAdminPassword123!

EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  (Gmail app-specific password, 16 chars)
EMAIL_FROM=noreply@heart-dating.com

FRONTEND_URL=https://your-frontend-domain.com
LOG_LEVEL=info

SPOTIFY_CLIENT_ID=(optional, leave blank if not using)
SPOTIFY_CLIENT_SECRET=(optional, leave blank if not using)
SPOTIFY_REDIRECT_URI=(your backend URL + /api/spotify/callback) (optional)

RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Code Ready for Production
- [ ] All dependencies in `backend/package.json`
- [ ] No hardcoded secrets in code
- [ ] Environment variables used for all config (see `.env` template)
- [ ] Error handling in place
- [ ] Security headers enabled (already done in `middleware/security.js`)

## Email Setup (Gmail)

For verification emails to work, set up Gmail app password:

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification (if not already enabled)
3. Go to App Passwords → select **Mail** and **Windows Computer**
4. Google generates a 16-character password
5. Copy this password to `EMAIL_PASSWORD` env var

**Alternative**: Use SendGrid (free tier) or other SMTP provider; update `routes/auth.js` to use their SMTP settings.

## Deployment Steps (General)

### 1. Push Code to GitHub
```bash
cd your-repo
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### 2. Choose Platform

- **Azure Users**: Follow [DEPLOY_AZURE.md](DEPLOY_AZURE.md)
- **Railway Users**: Follow [DEPLOY_RAILWAY.md](DEPLOY_RAILWAY.md)
- **Render Users**: Follow [DEPLOY_RENDER.md](DEPLOY_RENDER.md)

### 3. Set Environment Variables
Each platform has a **Secrets/Variables** section. Add your env vars from the template above.

### 4. Configure MongoDB Atlas Network Access
- Allow your deployment platform's IPs to access MongoDB
- Or allow `0.0.0.0/0` (less secure but simpler for testing)

### 5. Test Deployment
```bash
curl https://your-deployed-backend.com/api/health
```

Expected response:
```json
{"status":"Server is running","timestamp":"2026-02-11T..."}
```

### 6. Test Auth Endpoints
```bash
# Register
curl -X POST https://your-deployed-backend.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'

# You should get back a JWT token if successful
```

## Production Deployment Workflow

After initial setup, your workflow becomes:

1. **Make code changes locally**
2. **Test locally** (`npm run dev` in backend folder)
3. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Feature: add user preferences"
   git push
   ```
4. **Platform auto-deploys** (Railway/Render) or click **Deploy** (Azure)
5. **Check logs** for any errors

## Monitoring & Maintenance

### Check Logs
- **Azure**: `az webapp log tail --name heart-dating-app --resource-group heart-dating-rg`
- **Railway**: Dashboard → Logs tab
- **Render**: Dashboard → Logs tab

### View Metrics
- **Azure**: Portal → App → Metrics
- **Railway**: Dashboard → Metrics
- **Render**: Dashboard → Metrics

### Restart Service
- **Azure**: Restart in Portal → App → Overview
- **Railway**: Click service → **Redeploy**
- **Render**: Click service → **Manual Deploy**

## Scaling

If your app gets slow:

- **Azure**: Upgrade App Service Plan (B1 → B2 → S1, etc.)
- **Railway**: Increase resource allocation in service settings
- **Render**: Upgrade instance type from Settings

## Custom Domain

All three platforms support custom domains:

1. Register domain (GoDaddy, Namecheap, etc.)
2. Add DNS CNAME record pointing to platform's domain
3. Platform will auto-provision SSL certificate (free HTTPS)

Example:
```
api.yourdomain.com  CNAME  your-service.onrender.com
```

## Troubleshooting

### App crashes on deploy
- Check logs for error messages
- Verify all env vars are set
- Verify `package.json` in backend folder is valid JSON

### "Cannot connect to MongoDB"
- Check `MONGODB_URI` is correct
- Verify MongoDB Atlas accepts connections from platform's IP
- Ensure database user password is correct and URL-encoded if needed

### "Unauthorized" on admin endpoints
- Verify `JWT_SECRET` is set correctly (same on local and production)
- Check that Authorization header includes `Bearer <token>`

### 502 Bad Gateway
- App is crashing; check logs
- May need to restart service

### CORS errors
- Frontend URL may be wrong in `FRONTEND_URL` env var
- CORS is configured in `server.js` to use `FRONTEND_URL`

## Secrets Management Best Practices

- ❌ **Don't**: Commit `.env` with real secrets to GitHub
- ✅ **Do**: Set secrets in platform's secrets manager
- ✅ **Do**: Use `.env.example` (without values) to document required vars
- ✅ **Do**: Rotate secrets periodically (change `JWT_SECRET` every 6 months)
- ✅ **Do**: Use strong, random strings for `JWT_SECRET` (32+ characters)

## Next Steps

1. **Choose a platform** and follow its deployment guide
2. **Deploy the backend** and test endpoints
3. **Deploy the frontend** (Vercel, Netlify, or Azure Static Web Apps)
4. **Set up custom domain** (optional but recommended for production)
5. **Configure monitoring** and alerts
6. **Test end-to-end** (frontend → backend → database)

---

## Quick Links

- [Azure App Service Deployment](DEPLOY_AZURE.md)
- [Railway Deployment](DEPLOY_RAILWAY.md)
- [Render Deployment](DEPLOY_RENDER.md)
- [MongoDB Atlas Setup](https://docs.mongodb.com/atlas/getting-started/)
- [Gmail App Passwords](https://myaccount.google.com/apppasswords)

**Need Help?** Check the platform-specific guide or platform's documentation.
