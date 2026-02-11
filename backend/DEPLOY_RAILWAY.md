# Deploy to Railway

This guide covers deploying the Heart Dating App backend to **Railway** with **MongoDB Atlas**.

## Prerequisites

- Railway account (sign up at https://railway.app)
- GitHub account with your code pushed
- MongoDB Atlas cluster with connection string
- (Optional) Railway CLI installed

## Step 1: Create Railway Project

1. Go to https://railway.app and sign in
2. Click **New Project**
3. Select **Deploy from GitHub**
4. Connect your GitHub account and select your repository

## Step 2: Add Environment Variables

In Railway Dashboard:

1. Click your project
2. Go to **Variables** tab
3. Add each variable:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/heart-dating?retryWrites=true&w=majority` |
| `JWT_SECRET` | `your-super-secret-random-string-32-chars-min` |
| `ADMIN_EMAIL` | `your-admin@example.com` |
| `ADMIN_PASSWORD` | `SecurePassword123!` |
| `EMAIL_USER` | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | `xxxx xxxx xxxx xxxx` |
| `FRONTEND_URL` | `https://your-frontend-domain.com` |
| `SPOTIFY_CLIENT_ID` | (optional) |
| `SPOTIFY_CLIENT_SECRET` | (optional) |
| `SPOTIFY_REDIRECT_URI` | `https://your-railway-app.up.railway.app/api/spotify/callback` |

## Step 3: Set Up MongoDB Atlas Network Access

1. Go to MongoDB Atlas (https://cloud.mongodb.com)
2. Navigate to your cluster → **Network Access**
3. Add Railway's IP ranges:
   - Click **Add IP Address** → **Allow Access from Anywhere** (or add Railway's specific IPs)
   - Save

## Step 4: Configure Build & Deployment

Railway auto-detects Node.js apps from `package.json`. To customize:

1. Create `railway.json` in your backend folder (if needed):

```json
{
  "build": {
    "builder": "dockerfile",
    "buildCommand": "npm ci && npm run build"
  },
  "deploy": {
    "startCommand": "npm start"
  }
}
```

2. Or use the existing `Dockerfile` (if you have one):
   - Railway will detect and use it automatically

## Step 5: Deploy

1. Push code to GitHub:
```bash
git add .
git commit -m "Deploy to Railway"
git push
```

2. Railway will automatically build and deploy
3. Monitor deployment in the **Deployments** tab

## Step 6: Get Your Railway Domain

1. In Railway Dashboard, go to your service
2. Click **Domains** 
3. Copy your public URL (e.g., `https://heart-dating-app-production-xxxx.up.railway.app`)
4. Update `FRONTEND_URL` env var if needed

## Step 7: Test Deployment

```bash
curl https://heart-dating-app-production-xxxx.up.railway.app/api/health
```

Expected response:
```json
{"status":"Server is running","timestamp":"..."}
```

## Step 8: Connect Frontend

Update your frontend API base URL:

```javascript
const API_BASE = 'https://heart-dating-app-production-xxxx.up.railway.app/api';
```

## Troubleshooting

### App not deploying
- Check **Build Logs** in Railway Dashboard
- Common issues:
  - Missing env vars (check Variables tab)
  - Syntax errors in code

### MongoDB connection fails
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas Network Access (allow Railway IPs)
- Confirm database name matches in URI

### 503 Service Unavailable
- App may be starting; wait a moment
- Check logs for errors

## Create `Dockerfile` (Optional but Recommended)

If Railway struggles to deploy, create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 8080
ENV NODE_ENV=production

CMD ["npm", "start"]
```

Then commit and push. Railway will detect and use it.

## Production Checklist

- [ ] `JWT_SECRET` is strong and random
- [ ] Email credentials configured
- [ ] `FRONTEND_URL` is correct
- [ ] MongoDB Atlas whitelist includes Railway IPs
- [ ] Health endpoint returns 200
- [ ] Auth endpoints work (register/login)
- [ ] Admin endpoints secured

## Monitoring

- Railway Dashboard shows:
  - **Metrics**: Memory, CPU usage
  - **Logs**: Real-time application logs
  - **Deployments**: Deployment history

## Custom Domain

1. Go to your service → **Domains**
2. Click **Add Custom Domain**
3. Enter your domain (e.g., `api.yourdomain.com`)
4. Add DNS CNAME record as instructed
5. Wait for DNS propagation (~5-10 min)

## Next Steps

1. Deploy frontend
2. Configure custom domain
3. Monitor logs and performance
4. Set up alerts for failures

---

**More info**: https://docs.railway.app/
