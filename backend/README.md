# Heart Dating App - Backend Setup Guide

## Quick Start

### Prerequisites
- Node.js 14+ installed
- MongoDB Atlas account (free tier available)
- Gmail account (for email verification)
- Spotify API credentials (optional)

### Installation

1. **Navigate to backend folder:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create `.env` file from `.env.example`:**
```bash
cp .env.example .env
```

4. **Configure `.env` values:**

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB (get from MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/heart-dating?retryWrites=true&w=majority

# JWT
JWT_SECRET=use_a_secure_random_string_here
JWT_EXPIRE=7d

# Admin (from your frontend)
ADMIN_EMAIL=mbryce385@gmail.com
ADMIN_PASSWORD=Iamthebest101x

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@heart-dating.com

# Spotify (optional, for OAuth)
SPOTIFY_CLIENT_ID=your_spotify_id
SPOTIFY_CLIENT_SECRET=your_spotify_secret
SPOTIFY_REDIRECT_URI=http://localhost:5000/api/spotify/callback

# Frontend
FRONTEND_URL=http://localhost:8000
```

### MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create cluster
4. Get connection string
5. Replace `username:password` in MONGODB_URI

### Gmail Setup (Email Verification)

1. Enable 2-Factor Authentication on Gmail
2. Create App Password: https://support.google.com/accounts/answer/185833
3. Use the 16-character password in EMAIL_PASSWORD

### Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:5000`

## Database Models

### User
- email (unique)
- hashedPassword
- profile (fullName, bio, age, gender, orientation, location)
- profilePhotos (array, max 7)
- likes, matches, isVerified, isBanned
- createdAt, updatedAt

### Message
- from (User ID)
- to (User ID)
- text
- isRead, readAt
- createdAt

### Like
- from (User ID)
- to (User ID)
- isMatch
- createdAt

### VerificationCode
- email
- code
- attempts, maxAttempts
- isUsed
- expiresAt (15 min TTL)

### AdminLog
- adminId, action, targetUserId, details
- actions: BAN_USER, UNBAN_USER, DELETE_PHOTOS, DELETE_USER, VERIFY_USER, VIEW_REPORT

### BannedUser
- email, userId, reason
- ips, bannedBy
- bannedAt, isPermanent

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verify email with code
- `POST /api/auth/request-code` - Request new verification code

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/discover` - Get profiles to swipe
- `POST /api/users/like/:toUserId` - Like user (creates match if mutual)
- `POST /api/users/pass/:toUserId` - Pass on user
- `GET /api/users/matches` - Get matches
- `GET /api/users/:userId` - Get user by ID
- `POST /api/users/photos` - Add photo (base64)
- `DELETE /api/users/photos/:photoIndex` - Delete photo

### Messages
- `GET /api/messages/:otherUserId` - Get chat history
- `POST /api/messages` - Send message
- `GET /api/messages/conversations` - Get all conversations

### Admin
- `POST /api/admin/ban/:userId` - Ban user
- `POST /api/admin/unban/:email` - Unban user
- `DELETE /api/admin/photos/:userId` - Delete user photos
- `GET /api/admin/users` - Get all users
- `GET /api/admin/banned` - Get banned list
- `GET /api/admin/logs` - Get admin logs

### Spotify
- `GET /api/spotify/login` - Start Spotify auth
- `GET /api/spotify/callback` - Spotify callback
- `GET /api/spotify/user` - Get Spotify user profile

### Health
- `GET /api/health` - Server status

## Real-Time Events (Socket.io)

```javascript
// Client connects and joins chat room
socket.emit('join-chat', userId);

// Send message
socket.emit('new-message', { from, to, text });

// Receive message
socket.on('receive-message', (data) => { });

// Typing indicator
socket.emit('typing', { from, to });
socket.on('user-typing', (data) => { });

socket.emit('stopped-typing', { from, to });
socket.on('user-stopped-typing', (data) => { });
```

## Frontend Integration

See [FRONTEND_INTEGRATION.md](../FRONTEND_INTEGRATION.md) for complete frontend API integration guide.

## Testing Endpoints

### 1. Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "confirmPassword": "TestPassword123!"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

## Deployment

### Heroku
```bash
heroku create heart-dating-app
heroku config:set -a heart-dating-app NODE_ENV=production
heroku config:set -a heart-dating-app JWT_SECRET=your_random_key
git push heroku main
```

### Railway.app
```bash
railway init
railway up
```

### Vercel (with Node proxy)
See Vercel documentation for serverless Node.js

## Troubleshooting

**MongoDB connection fails:**
- Verify MONGODB_URI format
- Check IP whitelist in Atlas (add 0.0.0.0/0 for development)
- Ensure credentials are URL-encoded

**Email not sending:**
- Enable "Less secure app access" (Google)
- Or use App Password with 2FA enabled
- Check EMAIL_USER and EMAIL_PASSWORD

**CORS errors in frontend:**
- Verify FRONTEND_URL matches your frontend URL
- Check browser console for specific URL

**Socket.io issues:**
- Ensure frontend connects with correct server URL
- Check CORS configuration

## Production Checklist

- [ ] Change JWT_SECRET to long random string
- [ ] Use MongoDB Atlas production cluster
- [ ] Enable HTTPS only
- [ ] Set NODE_ENV=production
- [ ] Add rate limiting
- [ ] Set up monitoring/logging
- [ ] Configure email service (SendGrid)
- [ ] Add payment processing (if needed)
- [ ] Set up CDN for photos
- [ ] Enable database backups
- [ ] Add security headers
- [ ] Implement request validation

## Next Steps

1. Start backend: `npm run dev`
2. Update frontend to use API endpoints
3. Test authentication flow
4. Implement Socket.io for real-time messaging
5. Add image upload to cloud storage
6. Deploy to production

---

For issues or questions, check the logs or main repository README.
