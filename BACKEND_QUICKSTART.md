# Heart Dating App - Backend Quick Start

## 🚀 Get Running in 5 Minutes

### Step 1: Set Up MongoDB (2 min)
1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create account & free cluster
3. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/heart-dating`

### Step 2: Configure Email (1 min)
1. Open Gmail settings
2. Enable 2FA, create App Password
3. Copy the 16-character password

### Step 3: Create Backend .env (1 min)
```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/heart-dating
JWT_SECRET=your_random_secret_key_change_this
ADMIN_EMAIL=mbryce385@gmail.com
ADMIN_PASSWORD=Iamthebest101x
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=16-char-app-password
FRONTEND_URL=http://localhost:8000
```

### Step 4: Install & Run (1 min)
```bash
npm install
npm run dev
```

✅ Backend running on `http://localhost:5000`

---

## 📝 Quick API Test

### Test 1: Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","confirmPassword":"Test1234"}'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "userId": "507f1f77bcf86cd799439011",
  "email": "test@example.com"
}
```

### Test 2: Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

### Test 3: Get Profile (needs token)
```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test 4: Update Profile
```bash
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "fullName": "John Doe",
    "age": 28,
    "gender": "Male",
    "orientation": "Female",
    "location": "New York, NY",
    "bio": "Love hiking and coffee"
  }'
```

---

## 🔌 Frontend Integration (Next)

See [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) for:
- How to connect frontend to backend
- API helper functions
- Socket.io setup for messaging
- Authentication flow

Quick summary:
1. Add API config to app.js
2. Replace localStorage calls with API calls
3. Update Socket.io for real-time messaging
4. Test end-to-end

---

## 📂 Project Structure

```
inclusive-dating-app/
├── frontend/ (your current app.js, index.html, css/)
├── backend/
│   ├── server.js (main entry point)
│   ├── package.json
│   ├── .env.example
│   ├── models/ (User, Message, Like, etc.)
│   ├── routes/ (auth, users, messages, admin, spotify)
│   ├── middleware/ (auth.js)
│   └── README.md
├── FRONTEND_INTEGRATION.md
└── backend/README.md
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB connection fails | Check MONGODB_URI format and IP whitelist in Atlas |
| Email not sending | Use Gmail App Password (16 chars), enable 2FA |
| Port 5000 already in use | Change PORT in .env or kill process on 5000 |
| CORS errors | Make sure FRONTEND_URL matches your frontend URL |
| Token errors | Check JWT_SECRET consistency, token expiry |

---

## 🔐 Admin Access

The system comes with admin credentials hardcoded for development:
```
Email: mbryce385@gmail.com
Password: Iamthebest101x
```

In production:
- Move to database with encrypted passwords
- Use role-based access control (RBAC)
- Add 2FA for admin accounts
- Enable audit logging (already implemented)

---

## 🚢 Deploy Backend

### Heroku
```bash
heroku create heart-dating-app-backend
npm run build
git push heroku main
heroku config:set JWT_SECRET=your_secret
```

### Railway.app
```bash
railway init
railway up
```

### Vercel (Node.js)
Use serverless functions or serverless-http wrapper

---

## ✅ Next Steps

1. ✅ Backend created and running
2. 📋 Configure .env file
3. 🧪 Test API endpoints
4. 🔗 Integrate frontend (FRONTEND_INTEGRATION.md)
5. 💬 Test messaging with Socket.io
6. 🚀 Deploy to production

---

## 📞 API Documentation

### Key Endpoints

**Auth:**
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email` - Verify email

**Users:**
- `GET /api/users/profile` - Your profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/photos` - Add photo
- `GET /api/users/discover` - Get profiles to swipe
- `POST /api/users/like/:userId` - Like someone
- `GET /api/users/matches` - Your matches

**Messages:**
- `GET /api/messages/:userId` - Chat history
- `POST /api/messages` - Send message
- `GET /api/messages/conversations` - All chats

**Admin:** (requires admin auth)
- `POST /api/admin/ban/:userId` - Ban user
- `GET /api/admin/users` - List users
- `GET /api/admin/logs` - Activity logs

See [backend/README.md](./backend/README.md) for complete docs.

---

**Everything ready! Start backend with `npm run dev` and begin integrating frontend APIs.** 💕
