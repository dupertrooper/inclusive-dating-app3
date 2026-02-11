# Deploy to Render

This guide covers deploying the Heart Dating App backend to **Render** with **MongoDB Atlas**.

## Prerequisites

- Render account (sign up at https://render.com)
- GitHub account with your code pushed
- MongoDB Atlas cluster with connection string

## Step 1: Create Render Web Service

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Connect your GitHub account
4. Select your repository
5. Fill in details:
   - **Name**: `heart-dating-app`
   - **Environment**: `Node`
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend` (if backend is in subfolder)

## Step 2: Configure Environment Variables

Before deploying, add env vars:

1. In Render Dashboard, go to your service → **Environment**
2. Add variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/heart-dating?retryWrites=true&w=majority` |
| `JWT_SECRET` | `your-super-secret-random-string-32-chars-min` |
| `ADMIN_EMAIL` | `your-admin@example.com` |
| `ADMIN_PASSWORD` | `SecurePassword123!` |
| `EMAIL_USER` | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | `xxxx xxxx xxxx xxxx` (Gmail app password) |
| `FRONTEND_URL` | `https://your-frontend-domain.com` |
| `SPOTIFY_CLIENT_ID` | (optional) |
| `SPOTIFY_CLIENT_SECRET` | (optional) |
| `SPOTIFY_REDIRECT_URI` | `https://heart-dating-app.onrender.com/api/spotify/callback` |

Click **Save** for each variable.

## Step 3: Set MongoDB Atlas Network Access

1. Go to MongoDB Atlas (https://cloud.mongodb.com)
2. Select your cluster → **Network Access**
3. Add IP address:
   - Click **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0)
   - This is safe if your database is properly protected by credentials
   - Alternative: Whitelist Render's IP range (check Render docs)

## Step 4: Deploy

Click the **Deploy** button in Render Dashboard. Monitor the build logs.

## Step 5: Get Your Render Domain

Once deployed, you'll see a URL like:
```
https://heart-dating-app.onrender.com
```

This is your public API endpoint.

## Step 6: Test Deployment

```bash
curl https://heart-dating-app.onrender.com/api/health
```

Expected response:
```json
{"status":"Server is running","timestamp":"..."}
```

## Step 7: Configure Frontend

Update your frontend to use the Render URL:

```javascript
const API_BASE = 'https://heart-dating-app.onrender.com/api';

// Use in fetch calls:
const response = await fetch(`${API_BASE}/auth/register`, { ... });
```

## Create `render.yaml` (Optional)

For more control, create a `render.yaml` file in your repository root:

```yaml
services:
  - type: web
    name: heart-dating-api
    env: node
    buildCommand: cd backend && npm ci
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
```

## Troubleshooting

### App keeps crashing
1. Check **Logs** tab in Render Dashboard
2. Common issues:
   - Missing or wrong `MONGODB_URI`
   - Missing env vars
   - Port not set to `PORT` env var (Render assigns dynamically)

### MongoDB connection timeout
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas Network Access whitelist
- Ensure credentials in URI are correct

### 502 Bad Gateway
- Usually means app crashed; check logs
- Wait a few moments for app to restart

## Production Checklist

- [ ] All required env vars set in Render
- [ ] MongoDB Atlas accepts connections from anywhere
- [ ] `JWT_SECRET` is strong and random
- [ ] Email credentials configured
- [ ] Health endpoint returns 200 OK
- [ ] Auth endpoints work (register/login/profile)
- [ ] Admin endpoints require valid JWT token

## Monitoring & Logs

In Render Dashboard:
- **Logs**: Real-time server output
- **Metrics**: CPU, memory, requests per minute
- **Events**: Deployment history and status changes

## Custom Domain

1. Go to your service → **Custom Domains**
2. Enter your domain (e.g., `api.yourdomain.com`)
3. Add CNAME DNS record:
   ```
   api.yourdomain.com CNAME your-service.onrender.com
   ```
4. Wait for DNS propagation (~5-10 minutes)
5. Render will auto-renew SSL certificate

## Auto-Deploy on Git Push

Render automatically redeploys when you push to your configured branch (main/master). To disable:
- Service → **Settings** → turn off **Auto-Deploy**

## Next Steps

1. Deploy frontend (Vercel or Netlify recommended)
2. Set up custom domain
3. Test all API endpoints
4. Monitor logs for errors
5. Set up alerting for failures

## Restart Service (If Needed)

In Render Dashboard, click your service → **More** → **Restart Service** to force a redeploy without code changes.

---

**Render Docs**: https://render.com/docs/
