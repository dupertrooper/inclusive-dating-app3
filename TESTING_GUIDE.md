# 🧪 Testing Guide - Heart Dating App

## Launch the App

Using Python 3:
```bash
cd c:\Users\mbryc\Downloads\inclusive-dating-app
python -m http.server 8000
```

Then visit: `http://localhost:8000`

Using Node.js npx:
```bash
cd c:\Users\mbryc\Downloads\inclusive-dating-app
npx http-server
```

Then visit: `http://localhost:8080`

---

## Test Scenarios

### 1. **Create Account & Email Verification**

1. Click "Create Account"
2. Enter email, password, name
3. Demo code will be shown on screen
4. Copy and enter the code (e.g., `AB3XYZ`)
5. Click Verify
6. Proceeds to Profile Setup

**Expected**: Email section shows and code is displayed for demo

---

### 2. **Profile Setup - Personal Info**

1. After email verification, setup Step 1 appears
2. **Test Age Selection**:
   - Click age group buttons (18-25, 26-35, etc.)
   - **Or** enter custom age (18-120) and click "Set Age"
   - Try entering age 16 → should block you with age gate
3. **Test Gender**:
   - 11 options available (Man, Woman, Non-binary, etc.)
   - Select one → button highlights in purple
4. **Test Orientation**:
   - 14 options available (Straight, Gay, Lesbian, Bisexual, etc.)
   - Click one → saves automatically
5. **Test Location**:
   - Dropdown has 69 locations (all 50 states + 19 major cities)
   - Alphabetically sorted
   - Select any location
6. **Test Bio**:
   - Enter up to 300 characters
7. **Test Interests**:
   - 14 preset interests shown
   - Select up to 5 (max limit)
   - Add custom interest in input box
   - Click "Add" → appears as new button

**Click Continue** → goes to Photos step

---

### 3. **Profile Setup - Photos**

1. **Upload Photos**:
   - Click upload box
   - Select 1-7 images
   - Each appears immediately in preview
   - Counter shows "X of 7 photos"
2. **Remove Photos**:
   - Click × button on any photo
   - Removed immediately
3. **Must have 1+ photo** to continue
   - Try clicking next without photos → error alert

**Click Continue** → goes to Preferences step

---

### 4. **Profile Setup - Preferences**

1. **Spotify Connection**:
   - Click "Connect Spotify" button
   - Alert shows it will open OAuth in production
   - Click OK → marked as "✓ Spotify Connected!"
2. **Looking For**:
   - Dropdown with 3 options:
     - Serious Relationship
     - Casual Dating
     - Open to Anything
3. **Looking for Friends**:
   - Checkbox to include friend-seeking in profile

**Click Complete Profile** → redirects to Dashboard

---

### 5. **Main Dashboard - Swiping**

1. **Profile Card Shows**:
   - Photo + name, age, gender, orientation
   - Bio text
   - "Looking for: X" text
   - Photo counter (1/3, etc.)
2. **Test Photo Navigation**:
   - Click photo → next photo
   - Click thumbnail → jump to that photo
   - Thumbnails show which is current (purple border)
3. **Rate Profile**:
   - ❌ Pass button → next profile
   - ❤️ Like button → if mutual like, "It's a Match!" alert
   - 💌 Envelope button → start message with this person
4. **Matching**:
   - Like someone → if they liked you back, it's a match

---

### 6. **Messaging System**

1. **From Swipe Card**:
   - Click envelope button on any profile
   - Opens chat window
2. **From Matches List**:
   - Click "Matches" tab
   - Shows all matched profiles
   - Click "Message" button on any
3. **From Messages Tab**:
   - Click "Messages" tab
   - Shows conversation list
   - Click conversation → opens chat
4. **Send Message**:
   - Type in input box
   - Press Enter or click Send
   - Message appears immediately
   - Shows timestamp
   - Your messages on right (blue), their messages on left (gray)

**Messages persist** in localStorage across sessions

---

### 7. **Edit Profile**

1. Click "Profile" tab
2. See your profile info
3. Edit any field:
   - Add/remove photos
   - Change preferences
   - Update age/gender/orientation
   - Update bio
4. Click "Save Changes"
5. Success alert shown

---

### 8. **Admin Dashboard Test**

1. From home page, click "Admin" button
2. **Admin Login**:
   - Email: `mbryce385@gmail.com`
   - Password: `Iamthebest101x`
3. **Dashboard shows**:
   - Total users count
   - Banned users count
   - Verified users count
   - User management list
   - Admin activity logs

4. **User Management**:
   - See all regular users listed
   - **Ban user**: Click Ban button → user blocked
   - **Delete photos**: Click "Delete Photos" → removes images
   - **Unban user**: If already banned, shows Unban button
5. **Admin Logs**:
   - Shows all admin actions
   - Each with timestamp
   - Persists in localStorage

6. **Logout**: Click logout button → back to home

---

### 9. **Age Gate Test**

1. Create new account with age 16 (or custom age)
2. After filling profile info and clicking next:
   - Age under 18 redirects to age-blocked page
   - Shows: "❌ Age Verification Required"
   - Message: "We're sorry, but you must be at least 18 years old"
3. Only option: "Back Home"

---

### 10. **Error Handling Tests**

Try these to see error handling:

1. **Missing fields on signup**:
   - Leave any field blank
   - Alert: "Please fill all fields"

2. **Duplicate email**:
   - Register with same email twice
   - Alert: "Account already exists"

3. **Wrong age format**:
   - Custom age field: enter "abc"
   - Alert: "Please enter valid age between 18-120"

4. **No photos on swipe**:
   - Don't upload photos
   - Click next on step 1
   - Alert: "Please upload at least 1 photo"

5. **Admin login wrong credentials**:
   - Try different password
   - Alert: "Invalid admin credentials"

---

## Data Persistence

All data saved in **localStorage** under these keys:
- `profiles` - user accounts
- `likes` - who liked whom
- `matches` - mutual likes
- `images` - user photos (base64)
- `messages` - chat messages
- `verifiedUsers` - verified email list
- `verificationCodes` - email codes
- `bannedUsers` - banned user list
- `adminLogs` - admin actions

### To Clear All Data:
```javascript
// In browser console:
localStorage.clear()
// Then refresh page
```

---

## Browser Console Debugging

Check console for logs:
```bash
F12 → Console tab
```

Test specific features:
```javascript
// Check state
console.log(state.profiles)
console.log(state.messages)
console.log(state.bannedUsers)

// Check localStorage
console.log(localStorage.getItem('profiles'))

// Verify user object
console.log(state.user)
```

---

## Photo Upload Tips

For testing:
- Generate placeholder images at https://placehold.co
- Or use any local image files
- Base64 data stored in localStorage (limited to ~5-10MB)
- 7 photos max per user recommended

---

## Multi-User Testing

1. **User 1: Register & setup profile**
   - Email: `alice@test.com`
   - Add photos, set preferences

2. **User 2: Register & setup profile**
   - Email: `bob@test.com`
   - Add different photos

3. **User 1: Swipe on User 2**
   - Like Bob
   - Also try messaging

4. **User 2: Swipe on User 1**
   - Like Alice → should show "🎉 It's a Match!"

5. **Both can message**: 
   - Message history persists per user

---

## Known Limitations (localStorage-only)

- ❌ Doesn't work across devices
- ❌ Messages lost if localStorage cleared
- ❌ No real email sending
- ❌ No real Spotify login
- ❌ IP banning only in memory
- ✓ Perfect for local development & testing

---

## Production Deployment Checklist

- [ ] Set up Node.js backend with Express
- [ ] Connect to MongoDB/PostgreSQL database
- [ ] Implement real email verification with SMTP
- [ ] Add Spotify OAuth integration
- [ ] Deploy to Heroku/Railway/Vercel
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS properly
- [ ] Hash passwords with bcrypt
- [ ] Implement real socket.io for messaging
- [ ] Add rate limiting
- [ ] Set up monitoring & logging
- [ ] Test on multiple devices
- [ ] Add payment processing (if needed)

---

**Happy Testing! 🎉**

For issues, check the browser console (F12) or refer to PRODUCTION_FEATURES.md for backend setup.
