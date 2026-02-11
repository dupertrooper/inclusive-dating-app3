# Frontend to Backend Integration Guide

This guide covers updating your frontend (app.js) to connect to the Node.js backend APIs.

## Key Changes Needed

### 1. API Configuration

Add at the top of `app.js`:

```javascript
const API_URL = 'http://localhost:5000/api'; // Development
// const API_URL = 'https://heart-dating-app.com/api'; // Production

let authToken = localStorage.getItem('authToken');
let socket = null;

// Helper to make API calls
async function apiCall(endpoint, method = 'GET', body = null, requiresAuth = true) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (requiresAuth && authToken) {
        options.headers.Authorization = `Bearer ${authToken}`;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API Error');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
```

### 2. Authentication Flow Updates

**Old (localStorage only):**
```javascript
if (formType === 'signup') {
    const profile = { email, password, gender, age, photos };
    state.profiles.push(profile);
    localStorage.setItem('profiles', JSON.stringify(state.profiles));
}
```

**New (with backend):**
```javascript
if (formType === 'signup') {
    try {
        const result = await apiCall('/auth/register', 'POST', {
            email,
            password,
            confirmPassword: password
        }, false);

        authToken = result.token;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('userId', result.userId);

        // Move to email verification
        state.currentUser = { email, userId: result.userId };
        renderEmailVerification();
    } catch (error) {
        alert('Signup failed: ' + error.message);
    }
}
```

### 3. Profile Setup Integration

**Update profile save:**
```javascript
async function saveProfileSetup() {
    try {
        const profile = {
            fullName: state.currentUser.fullName,
            age: state.currentUser.age,
            gender: state.currentUser.gender,
            orientations: state.currentUser.orientations,
            location: state.currentUser.location,
            bio: state.currentUser.bio,
            lookingFor: state.currentUser.lookingFor
        };

        const result = await apiCall('/users/profile', 'PUT', profile);
        
        // Upload photos
        for (let photo of state.currentUser.photos) {
            await apiCall('/users/photos', 'POST', { photo });
        }

        alert('Profile created successfully!');
        state.isLoggedIn = true;
        renderDashboard();
    } catch (error) {
        alert('Profile setup failed: ' + error.message);
    }
}
```

### 4. Swiping/Discovery

**Replace localStorage discovery:**
```javascript
async function loadProfilesToSwipe() {
    try {
        const result = await apiCall('/users/discover');
        state.profilesToSwipe = result.profiles;
        state.currentSwipeIndex = 0;
        renderSwipeProfile();
    } catch (error) {
        console.error('Failed to load profiles:', error);
        state.profilesToSwipe = [];
    }
}

async function likeCurrentProfile() {
    if (state.currentSwipeIndex >= state.profilesToSwipe.length) return;

    const profile = state.profilesToSwipe[state.currentSwipeIndex];
    
    try {
        const result = await apiCall(`/users/like/${profile._id}`, 'POST');
        
        if (result.isMatch) {
            state.matches.push(profile._id);
            alert('✨ It\'s a Match! ✨');
        }

        nextSwipeProfile();
    } catch (error) {
        console.error('Like failed:', error);
    }
}
```

### 5. Messaging Integration

**Replace localStorage messaging:**
```javascript
// Initialize Socket.io
function initializeSocket(userId) {
    socket = io(API_URL.replace('/api', ''));
    
    socket.on('connect', () => {
        console.log('✓ Connected to messaging server');
        socket.emit('join-chat', userId);
    });

    socket.on('receive-message', (data) => {
        state.messages.push({
            from: data.from,
            text: data.text,
            timestamp: data.timestamp
        });
        if (state.currentChatUserId === data.from) {
            renderChatWindow();
        }
    });

    socket.on('user-typing', (data) => {
        // Show typing indicator
        console.log(`${data.from} is typing...`);
    });
}

async function sendMessage(text) {
    try {
        // Save to database
        await apiCall('/messages', 'POST', {
            to: state.currentChatUserId,
            text
        });

        // Emit via Socket.io for real-time
        socket.emit('new-message', {
            from: state.currentUser.userId,
            to: state.currentChatUserId,
            text
        });

        state.messages.push({
            from: state.currentUser.userId,
            text,
            timestamp: new Date().toISOString()
        });

        renderChatWindow();
    } catch (error) {
        console.error('Send failed:', error);
    }
}

async function loadChatHistory(userId) {
    try {
        const result = await apiCall(`/messages/${userId}`);
        state.messages = result.messages;
        renderChatWindow();
    } catch (error) {
        console.error('Failed to load messages:', error);
    }
}
```

### 6. Admin Panel Integration

**Update admin functions:**
```javascript
async function banUser(email) {
    if (req.email !== process.env.ADMIN_EMAIL) {
        alert('Admin access required');
        return;
    }

    try {
        const result = await apiCall(`/admin/ban/${email}`, 'POST', {
            reason: 'Violates community guidelines'
        });

        alert('User banned successfully');
        loadAdminUsers();
    } catch (error) {
        alert('Ban failed: ' + error.message);
    }
}

async function loadAdminUsers() {
    try {
        const result = await apiCall('/admin/users');
        state.adminUsers = result.users;
        renderAdminDashboard();
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

async function loadAdminLogs() {
    try {
        const result = await apiCall('/admin/logs');
        return result.logs;
    } catch (error) {
        console.error('Failed to load logs:', error);
        return [];
    }
}
```

### 7. Login Flow

**Update renderLogin():**
```javascript
async function handleLogin(email, password) {
    try {
        const result = await apiCall('/auth/login', 'POST', {
            email,
            password
        }, false);

        authToken = result.token;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('userId', result.userId);

        if (!result.isVerified) {
            state.pendingEmail = email;
            renderEmailVerification();
        } else {
            state.isLoggedIn = true;
            state.currentUser = { userId: result.userId, email };
            
            // Initialize Socket.io for messaging
            initializeSocket(result.userId);
            
            renderDashboard();
        }
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}
```

### 8. Photo Uploads (Base64 for Initial, Can Be Upgraded to S3)

**Current implementation uses base64:**
```javascript
// This stays the same - send base64 to backend
async function addPhotoToProfile(fileData) {
    try {
        const result = await apiCall('/users/photos', 'POST', {
            photo: fileData // base64 string
        });

        state.currentUser.photos = result.photos;
        renderPhotoUpload();
    } catch (error) {
        alert('Photo upload failed: ' + error.message);
    }
}
```

**For production, upgrade to AWS S3:**
```javascript
async function uploadPhotoToS3(file) {
    // Get pre-signed URL from backend
    const presignedResponse = await apiCall('/users/photos/presigned-url', 'POST');
    
    // Upload directly to S3
    await fetch(presignedResponse.url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
    });

    // Save URL in database
    await apiCall('/users/photos', 'POST', {
        url: presignedResponse.imageUrl
    });
}
```

### 9. Email Verification

**Existing code stays mostly the same:**
```javascript
async function verifyEmail(code) {
    try {
        const result = await apiCall('/auth/verify-email', 'POST', {
            email: state.pendingEmail,
            code
        });

        alert('Email verified!');
        state.isLoggedIn = true;
        renderDashboard();
    } catch (error) {
        alert('Verification failed: ' + error.message);
    }
}

async function requestNewCode() {
    try {
        await apiCall('/auth/request-code', 'POST', {
            email: state.pendingEmail
        }, false);
        alert('New code sent to email');
    } catch (error) {
        alert('Request failed: ' + error.message);
    }
}
```

## Migration Checklist

- [ ] Add API configuration at top of app.js
- [ ] Create `apiCall()` helper function
- [ ] Update signup to use /api/auth/register
- [ ] Update login to use /api/auth/login
- [ ] Update profile setup to use /api/users/profile
- [ ] Update photo upload to use /api/users/photos
- [ ] Update discovery to use /api/users/discover
- [ ] Update like/swipe to use /api/users/like
- [ ] Add Socket.io initialization
- [ ] Update messaging to use APIs + Socket.io
- [ ] Update admin functions
- [ ] Remove all localStorage profile/message saving
- [ ] Test full flow end-to-end
- [ ] Test with backend running on port 5000

## Testing After Integration

### 1. Test Registration Flow
```
1. Go to frontend
2. Sign up with test@example.com / TestPassword123
3. Should receive verification email (check spam)
4. Verify email
5. Complete profile setup
```

### 2. Test Login
```
1. Log out
2. Log in with same credentials
3. Should load previous profile
4. Should load discovered profiles
```

### 3. Test Messaging
```
1. Create 2 test accounts
2. Create a match between them
3. Send messages
4. Should appear in real-time
```

### 4. Test Admin
```
1. Log in as admin (mbryce385@gmail.com)
2. Access admin panel
3. View all users
4. Try banning a user
5. Check admin logs
```

## Deployment

Once tested locally:

1. Push backend to Heroku/Railway
2. Update API_URL in app.js to production URL
3. Configure CORS for production domain
4. Deploy frontend
5. Test end-to-end on production

---

**Note:** Keep localStorage for non-critical data like UI preferences, but all user data (profiles, messages, likes) should use the backend APIs.
