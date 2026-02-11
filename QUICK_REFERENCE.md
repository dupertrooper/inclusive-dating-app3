# 🚀 Quick Reference Card

## Backend Setup (Copy-Paste Commands)

```bash
# 1. Navigate to backend
cd backend

# 2. Copy env template
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Start server
npm run dev
```

## .env Configuration (Required Values)

```env
# MongoDB (get from MongoDB Atlas)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/heart-dating

# Gmail App Password (from Google Account Settings)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=16-character-app-password

# Random secret (can be any string for dev)
JWT_SECRET=development-secret-change-in-production

# Admin credentials
ADMIN_EMAIL=mbryce385@gmail.com
ADMIN_PASSWORD=Iamthebest101x

# Frontend URL
FRONTEND_URL=http://localhost:8000
```

## Test API Endpoints

```bash
# Register User
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234","confirmPassword":"Test1234"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234"}'

# Get Profile (replace TOKEN with actual token)
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer TOKEN"

# Get Discover Profiles
curl -X GET http://localhost:5000/api/users/discover \
  -H "Authorization: Bearer TOKEN"

# Send Like
curl -X POST http://localhost:5000/api/users/like/USER_ID \
  -H "Authorization: Bearer TOKEN"

# Send Message
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"to":"RECIPIENT_ID","text":"Hello!"}'
```

## API Endpoints (All 20+)

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/verify-email` - Verify email code

### Users
- `GET /api/users/profile` - Get your profile
- `PUT /api/users/profile` - Edit profile
- `GET /api/users/discover` - Get profiles to swipe
- `POST /api/users/like/:id` - Like someone
- `GET /api/users/matches` - Your matches
- `POST /api/users/photos` - Add photo
- `DELETE /api/users/photos/:index` - Delete photo

### Messages
- `GET /api/messages/:userId` - Chat history
- `POST /api/messages` - Send message
- `GET /api/messages/conversations` - All chats

### Admin
- `GET /api/admin/users` - All users
- `POST /api/admin/ban/:userId` - Ban user
- `GET /api/admin/logs` - Activity logs

### Other
- `GET /api/health` - Server status

## Frontend Integration (3 Steps)

### 1. Add API Config (top of app.js)
```javascript
const API_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('authToken');

async function apiCall(endpoint, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (authToken) options.headers.Authorization = `Bearer ${authToken}`;
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(`${API_URL}${endpoint}`, options);
    return response.json();
}
```

### 2. Replace Auth
```javascript
// OLD: localStorage.setItem('profiles', JSON.stringify(state.profiles));
// NEW:
const result = await apiCall('/auth/register', 'POST', {
    email, password, confirmPassword: password
});
authToken = result.token;
localStorage.setItem('authToken', authToken);
```

### 3. Replace All Data Operations
- Profile save → `/api/users/profile` (PUT)
- Photo upload → `/api/users/photos` (POST)
- Discovery → `/api/users/discover` (GET)
- Messaging → Socket.io + `/api/messages`
- Admin → `/api/admin/*`

## Database Models (Quick Reference)

### User
```
email, password, fullName, age, gender, orientation,
location, bio, profilePhotos[], isVerified, isBanned
```

### Message
```
from, to, text, isRead, createdAt
```

### Like
```
from, to, isMatch, createdAt
```

### Other Models
- VerificationCode (email, code, expires in 15 min)
- AdminLog (track all admin actions)
- BannedUser (track bans and IPs)

## Socket.io (Real-time Messaging)

```javascript
// Client Side
const socket = io('http://localhost:5000');
socket.emit('join-chat', userId);
socket.emit('new-message', { from, to, text });
socket.on('receive-message', (data) => { /* handle */ });
socket.emit('typing', { from, to });
socket.on('user-typing', (data) => { /* show indicator */ });
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| `ECONNREFUSED` | MongoDB not running - check MONGODB_URI |
| `Port 5000 in use` | Change PORT in .env or kill process |
| `Email not sending` | Use Gmail App Password (16 chars) |
| `JWT errors` | Verify JWT_SECRET matches |
| `CORS errors` | Check FRONTEND_URL in .env |
| `Module not found` | Run `npm install` |

## Files to Edit

When integrating frontend:

| File | What to Do |
|------|-----------|
| `app.js` | Add API config, replace localStorage calls |
| `.env` | Set MongoDB URI, email, secrets |
| `index.html` | Add Socket.io script tag |

## Important Notes

- ✅ Backend is production-ready
- ✅ 6 database models included
- ✅ Secure password hashing (bcrypt)
- ✅ JWT token auth
- ✅ Real-time messaging ready
- ✅ Admin system included
- ✅ Email verification ready

## Deployment URLs

```
Backend: heroku create my-app-backend
Frontend: vercel deploy
```

## Key Passwords (Development Only)

```
Admin Email: mbryce385@gmail.com
Admin Password: Iamthebest101x
```

⚠️ Change these in production!

## Resources

- Backend README: `backend/README.md`
- Integration Guide: `FRONTEND_INTEGRATION.md`
- Full Setup: `BACKEND_QUICKSTART.md`

---

**Start here:** `npm run dev` in backend folder, then follow FRONTEND_INTEGRATION.md
