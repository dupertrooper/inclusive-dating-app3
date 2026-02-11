# Heroku Deployment Guide (Backend)

1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli

2. Login:
```bash
heroku login
```

3. Create app:
```bash
cd backend
heroku create your-app-name
```

4. Set production config vars (replace values):
```bash
heroku config:set MONGODB_URI='mongodb+srv://<user>:<pass>@cluster0.mongodb.net/heart-dating?retryWrites=true&w=majority'
heroku config:set JWT_SECRET='REPLACE_WITH_STRONG_SECRET'
heroku config:set EMAIL_USER='your-email@gmail.com'
heroku config:set EMAIL_PASSWORD='your-app-password'
heroku config:set FRONTEND_URL='https://your-frontend-domain'
```

5. Add Procfile (already included) and push:
```bash
git add .
git commit -m "Prepare backend for Heroku"
git push heroku main
```

6. Scale web dyno (should be automatic):
```bash
heroku ps:scale web=1
```

7. View logs:
```bash
heroku logs --tail
```

Notes:
- Use `heroku config:set` to change env vars.
- Do not commit secrets to git. Use Heroku config for production secrets.
- If using GitHub integration, set config vars in Heroku dashboard.
