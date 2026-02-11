# Deploy to Azure App Service

This guide covers deploying the Heart Dating App backend to **Azure App Service** with **MongoDB Atlas** as the database.

## Prerequisites

- Azure account (create one at https://azure.microsoft.com)
- Azure CLI installed (`az` command available)
- MongoDB Atlas cluster set up with a connection string
- Git repository (your app code)

## Step 1: Create Azure Resources

### Option A: Using Azure Portal (GUI)

1. Go to https://portal.azure.com
2. Click **Create a resource** → Search for **App Service**
3. Create app with:
   - **Resource Group**: Create new (e.g., `heart-dating-rg`)
   - **Name**: `heart-dating-app` (must be unique globally)
   - **Runtime Stack**: Node 18 LTS
   - **Region**: East US (or your preferred region)
4. Click **Create**
5. Once created, go to the app → **Configuration** → **Application settings**

### Option B: Using Azure CLI

```bash
az group create --name heart-dating-rg --location eastus
az appservice plan create --name heart-dating-plan --resource-group heart-dating-rg --sku B1 --is-linux
az webapp create --resource-group heart-dating-rg --plan heart-dating-plan --name heart-dating-app --runtime "NODE|18-lts"
```

## Step 2: Configure Environment Variables

In Azure Portal, go to your App → **Configuration** → **Application settings** and add:

| Key | Value | Notes |
|-----|-------|-------|
| `PORT` | `8080` | Azure uses dynamic ports; use 8080 |
| `NODE_ENV` | `production` | Enables production mode |
| `MONGODB_URI` | `mongodb+srv://user:password@cluster.mongodb.net/heart-dating?retryWrites=true&w=majority` | Copy from MongoDB Atlas |
| `JWT_SECRET` | `your-super-secret-random-string-min-32-chars` | Generate a strong random string |
| `ADMIN_EMAIL` | `your-admin@example.com` | Admin account email |
| `ADMIN_PASSWORD` | `SecureAdminPassword123!` | Change in production |
| `EMAIL_USER` | `your-email@gmail.com` | Gmail account (for verification emails) |
| `EMAIL_PASSWORD` | `xxxx xxxx xxxx xxxx` | Gmail app-specific password (16 chars) |
| `FRONTEND_URL` | `https://your-frontend-domain.com` | Your frontend URL (Vercel or elsewhere) |
| `SPOTIFY_CLIENT_ID` | `xxx` | Optional: Spotify app ID |
| `SPOTIFY_CLIENT_SECRET` | `xxx` | Optional: Spotify app secret |
| `SPOTIFY_REDIRECT_URI` | `https://heart-dating-app.azurewebsites.net/api/spotify/callback` | Optional: Must match Azure app URL |

**Click Save** to apply settings.

## Step 3: Deploy Code to Azure

### Option A: Deploy from GitHub (Recommended)

1. In Azure Portal, go to App → **Deployment center**
2. Select **GitHub** as source
3. Authorize Azure to access your GitHub account
4. Select your repository and branch (`main` or `master`)
5. Azure will auto-deploy on every push to that branch

### Option B: Deploy via Git CLI

```bash
# Get deployment credentials from Azure Portal > App > Deployment Center
# Clone the Azure deployment repo
git clone https://heart-dating-app.scm.azurewebsites.net/heart-dating-app.git azure-deploy
cd azure-deploy

# Copy your backend code into this repo
cp -r ../backend/* ./

# Commit and push
git add .
git commit -m "Deploy heart dating backend"
git push
```

### Option C: Deploy via Azure CLI

```bash
az webapp up --name heart-dating-app --resource-group heart-dating-rg --runtime "NODE|18-lts"
```

## Step 4: Configure MongoDB Atlas Network Access

1. Go to https://cloud.mongodb.com → your cluster
2. **Cluster** → **Network Access**
3. **Add IP Address** → Enter Azure App Service outbound IPs:
   - In Azure Portal, go to App → **Properties** → Note the **Outbound IP Addresses**
   - Add each IP to MongoDB Atlas whitelist
   - Or allow `0.0.0.0/0` (less secure, but simpler for testing)

## Step 5: Verify Deployment

```bash
# Check logs
az webapp log tail --resource-group heart-dating-rg --name heart-dating-app

# Test health endpoint
curl https://heart-dating-app.azurewebsites.net/api/health
```

Expected response:
```json
{"status":"Server is running","timestamp":"2026-02-11T..."}
```

## Step 6: Set Up Frontend

Update your frontend to point to the backend:

```javascript
// In your app.js or API config
const API_BASE = 'https://heart-dating-app.azurewebsites.net/api';

// Example:
const response = await fetch(`${API_BASE}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

## Step 7: Configure Custom Domain (Optional)

1. In Azure Portal, go to App → **Custom domains**
2. Click **Add custom domain**
3. Enter your domain (e.g., `api.yourdomain.com`)
4. Add DNS records as instructed
5. Click **Validate** → **Add**

## Troubleshooting

### Backend not starting
```bash
az webapp log tail --resource-group heart-dating-rg --name heart-dating-app
```
Check logs for errors. Common issues:
- Missing env vars (check Configuration again)
- MongoDB connection error (check Atlas whitelist)

### 502 Bad Gateway
- App crashed; check logs above
- Port may be hardcoded; ensure `PORT` env var is used

### Connection timeout to MongoDB
- Check MongoDB Atlas Network Access whitelist
- Verify `MONGODB_URI` is correct
- Ensure VPN/firewall allows outbound to MongoDB

## Production Checklist

- [ ] `JWT_SECRET` is a strong, random 32+ character string
- [ ] `ADMIN_PASSWORD` is changed from default
- [ ] Email credentials are set (production Gmail or SendGrid)
- [ ] `FRONTEND_URL` matches your actual frontend domain
- [ ] MongoDB Atlas has restricted IP whitelist (or only needed IPs)
- [ ] Health endpoint returns 200 OK
- [ ] Auth register/login endpoints work
- [ ] Admin endpoints require valid token
- [ ] HTTPS is enabled (Azure provides free SSL)

## Scaling & Monitoring

- **Monitor**: Azure Portal → App → **Metrics** (CPU, memory, requests)
- **Scale up**: Change App Service Plan to a larger SKU (B2, S1, etc.)
- **Enable autoscale**: Set rules based on CPU/memory thresholds
- **Application Insights**: Enable for detailed tracing and errors

## Next Steps

1. Deploy frontend (Vercel, Netlify, or Azure Static Web Apps)
2. Set up custom domain and SSL
3. Configure CDN for static assets
4. Set up monitoring and alerting

---

**Questions?** Check Azure App Service docs: https://learn.microsoft.com/azure/app-service/
