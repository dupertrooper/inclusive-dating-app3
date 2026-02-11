# Railway Deployment Guide (Backend)

1. Install Railway CLI (optional): https://railway.app/

2. From the Railway dashboard, create a new project and link your GitHub repo or deploy from your local folder.

3. Set environment variables in Railway project settings (MONGODB_URI, JWT_SECRET, EMAIL_*).

4. If deploying via GitHub, connect the repo and enable automatic deploys.

5. Start the service; Railway will detect `package.json` and run `npm start` or `npm run dev` depending on settings.

Notes:
- Railway can provision a MongoDB plugin or you can use Atlas.
- Set `PORT` to the default Railway port or leave it unset (Railway will set it).
- Use the Railway dashboard to view logs and environment variables.
