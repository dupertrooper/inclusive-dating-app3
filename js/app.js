const app = document.getElementById('app');
const BACKEND_URL = 'https://inclusive-dating-app3.onrender.com';

// STATE MANAGEMENT
let state = {
    user: null,
    admin: null,
    isSigningUp: false,
    profiles: JSON.parse(localStorage.getItem('profiles') || '[]'),
    likes: JSON.parse(localStorage.getItem('likes') || '{}'),
    matches: JSON.parse(localStorage.getItem('matches') || '{}'),
    images: JSON.parse(localStorage.getItem('images') || '{}'),
    messages: JSON.parse(localStorage.getItem('messages') || '{}'),
    verifiedUsers: JSON.parse(localStorage.getItem('verifiedUsers') || '[]'),
    verificationCodes: JSON.parse(localStorage.getItem('verificationCodes') || '{}'),
    bannedUsers: JSON.parse(localStorage.getItem('bannedUsers') || '[]'),
    adminLogs: JSON.parse(localStorage.getItem('adminLogs') || '[]')
};

const ADMIN_EMAIL = 'mbryce385@gmail.com';
const ADMIN_PASSWORD = 'Iamthebest101x';

const profileSteps = ['Personal Info', 'Photos', 'Preferences'];
let currentStep = 0;
let uploadedImages = [];
let currentChatEmail = null;

// US LOCATIONS - ALL STATES AND MAJOR CITIES
const US_LOCATIONS = [
    // States
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
    // Major Cities
    'New York City', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio',
    'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Seattle', 'Denver', 'Boston',
    'Miami', 'Portland', 'Atlanta', 'Las Vegas', 'Nashville'
].sort();

// Restore session on page load
function initSession() {
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
    try {
      const userEmail = localStorage.getItem('userEmail');
      if (userEmail) {
        // Try to find local profile first
        const profile = state.profiles.find(p => p.email === userEmail.toLowerCase());
        if (profile) {
          state.user = { email: userEmail.toLowerCase() };
          renderDashboard();
          return;
        }

        // Fetch profile from backend
        fetch(`${BACKEND_URL}/api/users/profile`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` }
        })
        .then(async res => {
          if (!res.ok) throw new Error('Failed to restore session');
          const data = await res.json();
          const userProfile = data.profile || data.user || data;
          if (userProfile && userProfile.email) {
            userProfile.email = userProfile.email.toLowerCase();
            // merge into local profiles
            state.profiles = state.profiles.filter(p => p.email !== userProfile.email).concat(userProfile);
            save();
            state.user = { email: userProfile.email };
            renderDashboard();
            return;
          }
          state.user = { email: userEmail.toLowerCase() };
          renderDashboard();
        })
        .catch(err => {
          console.error('Error restoring session:', err);
          localStorage.removeItem('jwt');
          localStorage.removeItem('userEmail');
          renderHome();
        });
        return;
      }
    } catch (err) {
      console.error('Error restoring session:', err);
    }
    }
    renderHome();
}

function save() {
    localStorage.setItem('profiles', JSON.stringify(state.profiles));
    localStorage.setItem('likes', JSON.stringify(state.likes));
    localStorage.setItem('matches', JSON.stringify(state.matches));
    localStorage.setItem('images', JSON.stringify(state.images));
    localStorage.setItem('messages', JSON.stringify(state.messages));
    localStorage.setItem('verifiedUsers', JSON.stringify(state.verifiedUsers));
    localStorage.setItem('verificationCodes', JSON.stringify(state.verificationCodes));
    localStorage.setItem('bannedUsers', JSON.stringify(state.bannedUsers));
    localStorage.setItem('adminLogs', JSON.stringify(state.adminLogs));
}

function addAdminLog(action, details) {
    state.adminLogs.push({
        timestamp: new Date().toISOString(),
        admin: state.admin,
        action,
        details
    });
    save();
}

function generateVerificationCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function renderHome() {
    app.innerHTML = `
    <div class="auth-container">
      <div class="brand-header">
        <h1>💕 Heart</h1>
        <p>Find Your Perfect Match</p>
      </div>
      <div class="card">
        <div class="btn-group">
          <button class="btn-primary" onclick="renderSignup()">
            <i class="fas fa-user-plus"></i> Create Account
          </button>
          <button class="btn-secondary" onclick="renderLogin()">
            <i class="fas fa-sign-in-alt"></i> Login
          </button>
          <button class="btn-secondary" style="background:#667eea;color:white;" onclick="renderAdminLogin()">
            <i class="fas fa-lock"></i> Admin
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderAdminLogin() {
    app.innerHTML = `
    <div class="card">
      <h3>Admin Login</h3>
      <input id="adminEmail" type="email" placeholder="Admin Email" required>
      <input id="adminPass" type="password" placeholder="Admin Password" required>
      <button class="btn-primary" onclick="adminLogin()">
        <i class="fas fa-lock"></i> Login
      </button>
      <button class="btn-secondary" onclick="renderHome()">Back</button>
    </div>
  `;
}

function adminLogin() {
    const email = document.getElementById('adminEmail').value;
    const pass = document.getElementById('adminPass').value;

    if (email === ADMIN_EMAIL && pass === ADMIN_PASSWORD) {
        state.admin = { email };
        state.user = null;
        renderAdminDashboard();
    } else {
        alert('Invalid admin credentials');
    }
}

function renderAdminDashboard() {
    const allUsers = state.profiles.filter(p => p.email !== ADMIN_EMAIL);
    const bannedCount = state.bannedUsers.length;

    app.innerHTML = `
    <div style="padding: 20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h1 style="color:#667eea;margin:0;">💼 Admin Dashboard</h1>
        <button class="btn-secondary" style="width:auto;" onclick="adminLogout()">Logout</button>
      </div>
      
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-bottom:30px;">
        <div style="background:white;padding:20px;border-radius:15px;box-shadow:0 5px 15px rgba(0,0,0,0.1);">
          <div style="font-size:2em;color:#667eea;font-weight:700;">${allUsers.length}</div>
          <div style="color:#999;">Total Users</div>
        </div>
        <div style="background:white;padding:20px;border-radius:15px;box-shadow:0 5px 15px rgba(0,0,0,0.1);">
          <div style="font-size:2em;color:#ff4757;font-weight:700;">${bannedCount}</div>
          <div style="color:#999;">Banned Users</div>
        </div>
        <div style="background:white;padding:20px;border-radius:15px;box-shadow:0 5px 15px rgba(0,0,0,0.1);">
          <div style="font-size:2em;color:#667eea;font-weight:700;">${state.verifiedUsers.length}</div>
          <div style="color:#999;">Verified Users</div>
        </div>
      </div>
      
      <div style="background:white;padding:20px;border-radius:15px;box-shadow:0 5px 15px rgba(0,0,0,0.1);margin-bottom:20px;">
        <h3 style="color:#667eea;margin-top:0;">Manage Users</h3>
        <div style="max-height:400px;overflow-y:auto;">
          ${allUsers.map(user => `
            <div style="padding:12px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
              <div>
                <strong>${user.name}</strong><br>
                <small style="color:#999;">${user.email}</small><br>
                <small style="color:#667eea;">${user.age} • ${user.gender}</small>
              </div>
              <div style="display:flex;gap:8px;">
                ${state.bannedUsers.includes(user.email)?`
                  <button class="btn-secondary" style="background:#28a745;color:white;padding:6px 12px;font-size:0.9em;" onclick="unbanUser('${user.email}')">Unban</button>
                `:`
                  <button class="btn-secondary" style="background:#ff4757;color:white;padding:6px 12px;font-size:0.9em;" onclick="banUser('${user.email}')">Ban</button>
                `}
                <button class="btn-secondary" style="background:#ffa502;color:white;padding:6px 12px;font-size:0.9em;" onclick="adminDeletePhotos('${user.email}')">Delete Photos</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div style="background:white;padding:20px;border-radius:15px;box-shadow:0 5px 15px rgba(0,0,0,0.1);">
        <h3 style="color:#667eea;margin-top:0;">Admin Logs</h3>
        <div style="max-height:300px;overflow-y:auto;font-size:0.9em;">
          ${state.adminLogs.slice(-20).reverse().map(log => `
            <div style="padding:8px;border-bottom:1px solid #eee;">
              <strong>${log.action}</strong> - ${log.details}<br>
              <small style="color:#999;">${new Date(log.timestamp).toLocaleString()}</small>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function banUser(email) {
    if (!state.bannedUsers.includes(email)) {
        state.bannedUsers.push(email);
        addAdminLog('BAN_USER', `Banned user: ${email}`);
        save();
        renderAdminDashboard();
    }
}

function unbanUser(email) {
    state.bannedUsers = state.bannedUsers.filter(e => e !== email);
    addAdminLog('UNBAN_USER', `Unbanned user: ${email}`);
    save();
    renderAdminDashboard();
}

function adminDeletePhotos(email) {
    if (confirm(`Delete all photos for ${email}?`)) {
        state.images[email] = [];
        addAdminLog('DELETE_PHOTOS', `Deleted photos for: ${email}`);
        save();
        renderAdminDashboard();
    }
}

function adminLogout() {
    state.admin = null;
    renderHome();
}

function renderAgeGate() {
    app.innerHTML = `
    <div class="auth-container">
      <div class="card" style="text-align:center;padding:40px;">
        <h2 style="color:#667eea;margin-bottom:20px;">❌ Age Verification Required</h2>
        <p style="font-size:1.1em;color:#666;margin-bottom:30px;">
          We're sorry, but you must be at least 18 years old to use Heart Dating.
        </p>
        <p style="color:#999;margin-bottom:30px;font-size:0.95em;">
          This is to protect our community and comply with legal requirements.
        </p>
        <button class="btn-secondary" onclick="renderHome()" style="width:100%;">
          <i class="fas fa-arrow-left"></i> Back Home
        </button>
      </div>
    </div>
  `;
}

function renderSignup() {
    app.innerHTML = `
    <div class="card">
      <h3>Create Your Account</h3>
      <input id="email" type="email" placeholder="Email Address" required>
      <input id="pass" type="password" placeholder="Password" required>
      <input id="name" placeholder="First Name" required>
      <button class="btn-primary" onclick="signup()">
        <i class="fas fa-arrow-right"></i> Get Started
      </button>
      <button class="btn-secondary" onclick="renderHome()">Back</button>
    </div>
  `;
}

function signup() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;
    const name = document.getElementById('name').value;
    
    if (!email || !pass || !name) {
        alert('Please fill all fields');
        return;
    }
  // Prevent double-submits
  if (state.isSigningUp) return;
  state.isSigningUp = true;

  const btn = document.querySelector('.btn-primary[onclick="signup()"]');
  const originalBtnText = btn ? btn.innerHTML : null;
  if (btn) btn.innerHTML = 'Creating account...';

  // Call backend API
  fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass, name })
  })
  .then(async res => {
    const data = await res.json().catch(() => ({ error: 'Invalid server response' }));
    if (!res.ok) {
      throw new Error(data.error || 'Server error');
    }
    return data;
  })
  .then(data => {
    // Store JWT and email for session
    if (data.token) {
      localStorage.setItem('jwt', data.token);
    }
    localStorage.setItem('userEmail', email.toLowerCase());
    state.user = { email: email.toLowerCase() };
    state.isSigningUp = false;
    if (btn) btn.innerHTML = originalBtnText;
    renderEmailVerification(email.toLowerCase());
  })
  .catch(err => {
    console.error('Signup error:', err);
    state.isSigningUp = false;
    if (btn) btn.innerHTML = originalBtnText;
    alert(err.message || 'Error creating account. Please try again.');
  });
}

function renderEmailVerification(email) {
    app.innerHTML = `
    <div class="card" style="text-align:center;padding:30px;">
      <h3 style="color:#667eea;margin-top:0;">✉️ Verify Your Email</h3>
      <p style="color:#666;margin:15px 0;font-size:1.05em;">
        A verification code has been sent to:<br>
        <strong style="color:#667eea;">${email}</strong>
      </p>
      <div style="background:#f5f5f5;padding:15px;border-radius:8px;margin:20px 0;border-left:4px solid #667eea;text-align:left;">
        <p style="margin:0;color:#666;font-size:0.95em;"><strong>Check your email:</strong></p>
        <p style="margin:8px 0 0 0;color:#999;font-size:0.9em;">Look for an email from Heart Dating App and enter the 6-digit code below</p>
      </div>
      <input id="verificationCode" type="text" placeholder="Enter 6-digit code" maxlength="6" style="text-align:center;letter-spacing:8px;font-size:1.5em;">
      <button class="btn-primary" style="width:100%;" onclick="verifyEmail()">>
        <i class="fas fa-check"></i> Verify
      </button>
      <button class="btn-secondary" style="width:100%;margin-top:10px;" onclick="renderHome()">← Back Home</button>
    </div>
  `;
}

function verifyEmail() {
    const code = document.getElementById('verificationCode').value.trim();
    
    if (!code || code.length !== 6) {
        alert('Please enter a valid 6-digit code');
        return;
    }
    
    const jwt = localStorage.getItem('jwt');
    fetch(`${BACKEND_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({ code })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }
        alert('✓ Email verified! Continuing to profile setup...');
        currentStep = 0;
        renderProfileSetup();
    })
    .catch(err => {
        console.error('Verification error:', err);
        alert('Error verifying email. Please try again.');
    });
}

function renderLogin() {
    app.innerHTML = `
    <div class="card">
      <h3>Login</h3>
      <input id="email" type="email" placeholder="Email">
      <input id="pass" type="password" placeholder="Password">
      <button class="btn-primary" onclick="login()">
        <i class="fas fa-arrow-right"></i> Login
      </button>
      <button class="btn-secondary" onclick="renderHome()">Back</button>
    </div>
  `;
}

function login() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;
    
    if (!email || !pass) {
        alert('Please enter email and password');
        return;
    }
    
    // Call backend API
    fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }
        
        // Store JWT and email for session persistence
        localStorage.setItem('jwt', data.token);
        localStorage.setItem('userEmail', email);
        state.user = { email };
        
        // Check if profile complete
        if (data.profileComplete) {
            renderDashboard();
        } else {
            currentStep = 0;
            renderProfileSetup();
        }
    })
    .catch(err => {
        console.error('Login error:', err);
        alert('Error logging in. Please try again.');
    });
}

function renderProfileSetup() {
    const progress = (currentStep + 1) / profileSteps.length * 100;
    const step = profileSteps[currentStep];
    const userProfile = state.profiles.find(p => p.email === state.user.email);

    let stepContent = '';
    const genderOptions = ['Man', 'Woman', 'Non-binary', 'Genderqueer', 'Two-Spirit', 'Transgender Man', 'Transgender Woman', 'Agender', 'Bigender', 'Prefer to self-define', 'Prefer not to say'];
    const orientationOptions = ['Straight/Heterosexual', 'Gay', 'Lesbian', 'Bisexual', 'Asexual', 'Aromantic', 'Demisexual', 'Graysexual', 'Pansexual', 'Polysexual', 'Queer', 'Questioning', 'Prefer to self-define', 'Prefer not to say'];
    const ageGroups = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+'];
    const interests = ['Travel', 'Sports', 'Music', 'Art', 'Cooking', 'Fitness', 'Gaming', 'Movies', 'Reading', 'Yoga', 'Meditation', 'Photography', 'Writing', 'Hiking'];

    if (currentStep === 0) {
        const allInterests = [...interests, ...(userProfile.customInterests || [])];
        stepContent = `
      <div class="form-step">
        <h4 style="color:#667eea;margin-bottom:15px;">Tell us about yourself</h4>
        
        <label style="display:block;color:#666;font-weight:600;margin:15px 0 10px;">Age Group</label>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:15px;">
          ${ageGroups.map(age=>`
            <button type="button" style="padding:10px;border:2px solid ${userProfile.age===age?'#667eea':'#ddd'};background:${userProfile.age===age?'#f0f4ff':'white'};color:${userProfile.age===age?'#667eea':'#333'};border-radius:10px;cursor:pointer;font-weight:600;transition:all 0.3s;font-size:0.9em;" onclick="selectAge('${age}')">${age}</button>
          `).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-bottom:15px;align-items:center;">
          <input id="actualAge" type="number" placeholder="Or enter your actual age..." min="18" max="120" style="flex:1;">
          <button type="button" style="padding:10px 15px;background:#667eea;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600;white-space:nowrap;" onclick="selectCustomAge()">Set Age</button>
        </div>
        
        <label style="display:block;color:#666;font-weight:600;margin:15px 0 10px;">Gender</label>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:15px;">
          ${genderOptions.map(g=>`
            <button type="button" style="padding:10px;border:2px solid ${userProfile.gender===g?'#667eea':'#ddd'};background:${userProfile.gender===g?'#f0f4ff':'white'};color:${userProfile.gender===g?'#667eea':'#333'};border-radius:10px;cursor:pointer;font-weight:600;transition:all 0.3s;font-size:0.9em;" onclick="selectGender('${g}')">${g}</button>
          `).join('')}
        </div>
        
        <label style="display:block;color:#666;font-weight:600;margin:15px 0 10px;">Orientation</label>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:15px;">
          ${orientationOptions.map(o=>`
            <button type="button" style="padding:10px;border:2px solid ${userProfile.orientation===o?'#667eea':'#ddd'};background:${userProfile.orientation===o?'#f0f4ff':'white'};color:${userProfile.orientation===o?'#667eea':'#333'};border-radius:10px;cursor:pointer;font-weight:600;transition:all 0.3s;font-size:0.9em;" onclick="selectOrientation('${o}')">${o}</button>
          `).join('')}
        </div>
        
        <label style="display:block;color:#666;font-weight:600;margin:15px 0 10px;">Location</label>
        <select id="location" required>
          <option value="">Select your location</option>
          ${US_LOCATIONS.map(loc=>`<option value="${loc}" ${userProfile.location===loc?'selected':''}>${loc}</option>`).join('')}
        </select>
        
        <label style="display:block;color:#666;font-weight:600;margin:15px 0 10px;">Bio</label>
        <textarea id="bio" placeholder="Tell people about yourself..." maxlength="300" style="resize:vertical;height:100px;">${userProfile.bio||''}</textarea>
        
        <label style="display:block;color:#666;font-weight:600;margin:15px 0 10px;">Your Interests</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
          ${allInterests.map(interest=>`
            <button type="button" style="background:${userProfile.interests.includes(interest)?'linear-gradient(135deg,#667eea 0%,#764ba2 100%)':'#f0f0f0'};color:${userProfile.interests.includes(interest)?'white':'#333'};border:none;padding:8px 12px;border-radius:20px;cursor:pointer;transition:all 0.3s;font-size:0.9em;" onclick="toggleInterest('${interest}')">${interest}</button>
          `).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-bottom:15px;">
          <input id="customInterest" type="text" placeholder="Add custom interest..." style="flex:1;">
          <button type="button" style="padding:8px 15px;background:#667eea;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600;" onclick="addCustomInterest()">Add</button>
        </div>
        <p style="color:#667eea;font-weight:600;margin:10px 0;">${userProfile.interests.length} interests selected</p>
      </div>
    `;
    } else if (currentStep === 1) {
        const images = state.images[state.user.email] || [];
        stepContent = `
      <div class="form-step">
        <h4 style="color:#667eea;margin-bottom:15px;">Add Your Photos</h4>
        <p style="color:#999;font-size:0.9em;margin-bottom:15px;">Upload 5-7 photos for the best results!</p>
        <div class="image-upload-box" onclick="document.getElementById('imageInput').click()">
          <i class="fas fa-cloud-upload-alt" style="font-size:2em;color:#667eea;margin-bottom:10px;display:block;"></i>
          <p>Click to Upload</p>
          <small style="color:#999;">or drag and drop</small>
        </div>
        <input type="file" id="imageInput" accept="image/*" onchange="handleImageUpload(event)">
        ${images.length>0?`
          <div class="image-preview">
            ${images.map((img,i)=>`
              <div class="preview-item">
                <img src="${img}">
                <button class="remove-btn" onclick="removeImage(${i})">×</button>
              </div>
            `).join('')}
          </div>
          <p style="color:#667eea;font-weight:600;margin:10px 0;text-align:center;">${images.length} of 7 photos</p>
        `:'<p style="color:#999;text-align:center;margin:20px 0;">No photos yet</p>'}
      </div>
    `;
    } else if(currentStep===2){
        stepContent=`
      <div class="form-step">
        <h4 style="color:#667eea;margin-bottom:15px;">What are you looking for?</h4>
        <select id="lookingFor" required style="margin-bottom:20px;">
          <option value="">Select what you're looking for</option>
          <option value="Relationship" ${userProfile.lookingFor==='Relationship'?'selected':''}>Serious Relationship</option>
          <option value="Casual" ${userProfile.lookingFor==='Casual'?'selected':''}>Casual Dating</option>
          <option value="Open" ${userProfile.lookingFor==='Open'?'selected':''}>Open to Anything</option>
        </select>
        
        <div style="background:#f8f9ff;padding:15px;border-radius:10px;">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
            <input type="checkbox" id="lookingForFriends" ${userProfile.lookingForFriends?'checked':''}>
            <span style="font-weight:600;color:#667eea;">Also looking to make friends</span>
          </label>
        </div>
      </div>
    `;
    }
  
  app.innerHTML=`
    <div class="profile-setup">
      <div class="profile-progress">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-weight:600;color:#667eea;">Step ${currentStep+1} of ${profileSteps.length}: ${step}</span>
          <button class="btn-secondary" style="width:auto;padding:6px 12px;font-size:0.9em;" onclick="renderHome()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${progress}%"></div>
        </div>
        <div class="progress-text">${progress.toFixed(0)}% Complete</div>
      </div>
      
      <div class="card" style="flex:1;">
        ${stepContent}
        <div style="display:flex;gap:10px;margin-top:30px;">
          ${currentStep>0?`<button class="btn-secondary" style="flex:1;" onclick="previousStep()"><i class="fas fa-arrow-left"></i> Back</button>`:''}
          <button class="btn-primary" style="flex:${currentStep>0?1:2};" onclick="nextStep()">
            ${currentStep===profileSteps.length-1?'Complete Profile':'Continue'} <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

function handleImageUpload(event){
  const files=event.target.files;
  if(!files.length) return;
  
  const images=state.images[state.user.email]||[];
  if(images.length>=7){
    alert('Maximum 7 photos allowed');
    event.target.value='';
    return;
  }
  
  const file=files[0];
  const reader=new FileReader();
  reader.onload=function(e){
    images.push(e.target.result);
    state.images[state.user.email]=images;
    save();
    
    event.target.value='';
    
    renderProfileSetup();
  };
  reader.readAsDataURL(file);
}

function selectGender(gender){
  const userProfile=state.profiles.find(p=>p.email===state.user.email);
  userProfile.gender=gender;
  save();
  renderProfileSetup();
}

function selectOrientation(orientation){
  const userProfile=state.profiles.find(p=>p.email===state.user.email);
  userProfile.orientation=orientation;
  save();
  renderProfileSetup();
}

function selectAge(ageGroup){
  const userProfile=state.profiles.find(p=>p.email===state.user.email);
  userProfile.age=ageGroup;
  save();
  renderProfileSetup();
}

function selectCustomAge(){
  const ageInput=document.getElementById('actualAge');
  const age=ageInput.value.trim();
  if(!age || isNaN(age) || age<18 || age>120){
    alert('Please enter a valid age between 18 and 120');
    return;
  }
  const userProfile=state.profiles.find(p=>p.email===state.user.email);
  userProfile.age=age;
  save();
  renderProfileSetup();
}

function editSelectCustomAge(){
  const ageInput=document.getElementById('editActualAge');
  const age=ageInput.value.trim();
  if(!age || isNaN(age) || age<18 || age>120){
    alert('Please enter a valid age between 18 and 120');
    return;
  }
  const userProfile=state.profiles.find(p=>p.email===state.user.email);
  userProfile.age=age;
  save();
  renderEditProfile();
}

function addCustomInterest(){
  const input=document.getElementById('customInterest');
  const interest=input.value.trim();
  if(!interest) return;
  
  const userProfile=state.profiles.find(p=>p.email===state.user.email);
  if(!userProfile.customInterests) userProfile.customInterests=[];
  
  if(!userProfile.customInterests.includes(interest)){
    userProfile.customInterests.push(interest);
    userProfile.interests.push(interest);
    save();
    renderProfileSetup();
  }
}

function removeImage(index){
  const images=state.images[state.user.email]||[];
  images.splice(index,1);
  state.images[state.user.email]=images;
  save();
  renderProfileSetup();
}

function toggleInterest(interest){
  const userProfile=state.profiles.find(p=>p.email===state.user.email);
  const idx=userProfile.interests.indexOf(interest);
  if(idx>-1){
    userProfile.interests.splice(idx,1);
  }else if(userProfile.interests.length<5){
    userProfile.interests.push(interest);
  }else{
    alert('Maximum 5 interests');
    return;
  }
  save();
  renderProfileSetup();
}

function nextStep(){
  const userProfile=state.profiles.find(p=>p.email===state.user.email);
  
  if(currentStep===0){
    if(!userProfile.age||!userProfile.gender||!userProfile.orientation){
      alert('Please select Age, Gender, and Orientation');
      return;
    }
    const locationSelect=document.getElementById('location');
    const bioInput=document.getElementById('bio');
    
    if(locationSelect.value===''){
      alert('Please select a location');
      return;
    }
    
    // Age gate check
    const ageNum=parseInt(userProfile.age);
    if(ageNum<18){
      renderAgeGate();
      return;
    }
    
    if(locationSelect) userProfile.location=locationSelect.value;
    if(bioInput) userProfile.bio=bioInput.value;
  }
  
  if(currentStep===1){
    const images=state.images[state.user.email]||[];
    if(images.length===0){
      alert('Please upload at least 1 photo before continuing');
      return;
    }
  }
  
  if(currentStep===2){
    const lookingForSelect=document.getElementById('lookingFor');
    const friendsCheckbox=document.getElementById('lookingForFriends');
    if(lookingForSelect) userProfile.lookingFor=lookingForSelect.value;
    if(friendsCheckbox) userProfile.lookingForFriends=friendsCheckbox.checked;
  }
  
  if(currentStep<profileSteps.length-1){
    currentStep++;
    save();
    renderProfileSetup();
  }else{
    save();
    renderDashboard();
  }
}

function previousStep(){
  if(currentStep>0){
    currentStep--;
    renderProfileSetup();
  }
}

function renderDashboard(){
  const userProfile=state.profiles.find(p=>p.email===state.user.email);
  const userImages=state.images[state.user.email]||[];
  const userInitials=userProfile.name.split(' ').map(n=>n[0]).join('').toUpperCase();
  
  app.innerHTML=`
    <div class="nav">
      <button class="active" onclick="renderSwipe()"><i class="fas fa-fire"></i> Discover</button>
      <button onclick="renderMatches()"><i class="fas fa-heart"></i> Matches</button>
      <button onclick="renderMessages()"><i class="fas fa-envelope"></i> Messages</button>
      <button onclick="renderEditProfile()"><i class="fas fa-user"></i> Profile</button>
    </div>
    
    <div class="profile-header">
      <div class="user-info">
        <div class="user-avatar">${userImages[0]?`<img src="${userImages[0]}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`:userInitials}</div>
        <div class="user-details">
          <h3>${userProfile.name}, ${userProfile.age}</h3>
          <p><i class="fas fa-map-marker-alt"></i> ${userProfile.location}</p>
        </div>
      </div>
    </div>
  `;
  renderSwipe();
}

function renderSwipe(){
  const others=state.profiles.filter(p=>p.email!==state.user.email && !state.bannedUsers.includes(p.email));
  
  if(others.length===0){
    app.innerHTML=`
      <div class="card" style="text-align:center;padding:40px 20px;">
        <i class="fas fa-search" style="font-size:3em;color:#ddd;margin-bottom:10px;display:block;"></i>
        <p style="color:#999;">No more profiles to discover</p>
        <button class="btn-secondary" onclick="renderFeed()" style="margin-top:20px;width:100%;"><i class="fas fa-arrow-left"></i> Back to Feed</button>
      </div>
    `;
    return;
  }
  
  const profile=others[0];
  const images=state.images[profile.email]||[];
  const mainImage=images[0]?`<img src="${images[0]}" style="width:100%;height:100%;object-fit:cover;">`:`<i class="fas fa-user" style="font-size:2em;color:white;"></i>`;
  
  app.innerHTML=`
    <div style="padding:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h2 style="color:#667eea;margin:0;">Discover</h2>
        <button class="btn-secondary" style="width:auto;" onclick="renderFeed()"><i class="fas fa-arrow-left"></i> Back</button>
      </div>
      <div class="swipe-container" id="swiperContainer">
        <div class="swipe-card" id="swipeCard" data-email="${profile.email}" data-photo="0" data-total="${images.length}" style="transform:translateX(0) rotate(0deg);cursor:pointer;">
          <div class="card-image photo-display" onclick="nextPhoto('${profile.email}')" style="position:relative;">
            ${mainImage}
            ${images.length>1?`<div style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.5);color:white;padding:6px 12px;border-radius:20px;font-size:0.85em;font-weight:600;">1/${images.length}</div>`:''} 
          </div>
          <div class="card-info">
            <div class="card-name">${profile.name}, ${profile.age}</div>
            <div class="card-details">${profile.gender} • ${profile.orientation}${profile.lookingForFriends?' • 👥 Wants friends':''}</div>
            <div class="card-bio">${profile.bio||'No bio'}</div>
            ${profile.lookingFor?`<div style="color:#667eea;font-weight:600;font-size:0.9em;margin-top:5px;">Looking for: ${profile.lookingFor}</div>`:''} 
          </div>
        </div>
      </div>
      
      <div class="swipe-actions">
        <button class="action-btn btn-pass" title="Pass" onclick="passUser('${profile.email}')">
          <i class="fas fa-times"></i>
        </button>
        <button class="action-btn btn-like" title="Like" onclick="likeUser('${profile.email}')">
          <i class="fas fa-heart"></i>
        </button>
        <button class="action-btn" style="background:#667eea;color:white;width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;font-size:1.8em;display:flex;align-items:center;justify-content:center;box-shadow:0 5px 15px rgba(0,0,0,0.2);transition:all 0.3s;" title="Message" onclick="startMessage('${profile.email}')">
          <i class="fas fa-envelope"></i>
        </button>
      </div>
      
      ${images.length>0?`<div style="display:grid;grid-template-columns:repeat(${Math.min(images.length,5)},1fr);gap:8px;margin-top:20px;">
        ${images.map((img,i)=>`<div style="height:50px;border-radius:8px;overflow:hidden;border:2px solid ${0===i?'#667eea':'transparent'};cursor:pointer;" onclick="jumpToPhoto('${profile.email}',${i});"><img src="${img}" style="width:100%;height:100%;object-fit:cover;"></div>`).join('')}
      </div>`:''} 
    </div>
  `;
  
  setupCardSwipe();
}

function nextPhoto(email){
  const card=document.getElementById('swipeCard');
  let current=parseInt(card.dataset.photo);
  let total=parseInt(card.dataset.total);
  current=(current+1)%total;
  updateCardPhoto(email,current);
}

function jumpToPhoto(email,index){
  updateCardPhoto(email,index);
}

function updateCardPhoto(email,index){
  const card=document.getElementById('swipeCard');
  const profile=state.profiles.find(p=>p.email===email);
  const images=state.images[email]||[];
  if(!images[index]) return;
  
  card.dataset.photo=index;
  const img=images[index];
  const photoDisplay=card.querySelector('.photo-display');
  photoDisplay.innerHTML=`<img src="${img}" style="width:100%;height:100%;object-fit:cover;">${images.length>1?`<div style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.5);color:white;padding:6px 12px;border-radius:20px;font-size:0.85em;font-weight:600;">${index+1}/${images.length}</div>`:''} `;
  
  const thumbnails=document.querySelectorAll('[onclick*="jumpToPhoto"]');
  thumbnails.forEach((thumb,i)=>{
    thumb.style.borderColor=i===index?'#667eea':'transparent';
  });
}

function setupCardSwipe(){
  const card=document.getElementById('swipeCard');
  if(!card) return;
  let startX=0;
  
  card.addEventListener('mousedown',(e)=>{
    startX=e.clientX;
    card.classList.add('dragging');
  });
  
  document.addEventListener('mousemove',(e)=>{
    if(startX===0) return;
    const diff=e.clientX-startX;
    const rotate=diff*0.1;
    card.style.transform=`translateX(${diff}px) rotate(${rotate}deg)`;
  });
  
  document.addEventListener('mouseup',(e)=>{
    if(startX===0) return;
    const diff=e.clientX-startX;
    card.classList.remove('dragging');
    
    if(Math.abs(diff)>100){
      if(diff>0) likeUser(card.dataset.email);
      else passUser(card.dataset.email);
    }else{
      card.style.transform='translateX(0) rotate(0deg)';
    }
    startX=0;
  });
}

function likeUser(email){
  const others=state.profiles.filter(p=>p.email!==state.user.email);
  if(others.length===0) return;
  const profile=others[0];
  
  state.likes[state.user.email]=state.likes[state.user.email]||[];
  if(!state.likes[state.user.email].includes(profile.email)){
    state.likes[state.user.email].push(profile.email);
  }
  
  if(state.likes[profile.email]&&state.likes[profile.email].includes(state.user.email)){
    state.matches[state.user.email]=state.matches[state.user.email]||[];
    state.matches[profile.email]=state.matches[profile.email]||[];
    if(!state.matches[state.user.email].includes(profile.email)){
      state.matches[state.user.email].push(profile.email);
      state.matches[profile.email].push(state.user.email);
    }
    alert('🎉 It\'s a Match! You can now message each other!');
  }
  
  save();
  app.innerHTML=app.innerHTML.split('<div class="nav">')[0]+'<div class="nav">'+app.innerHTML.split('<div class="nav">')[1];
  renderDashboard();
}

function passUser(email){
  app.innerHTML=app.innerHTML.split('<div class="nav">')[0]+'<div class="nav">'+app.innerHTML.split('<div class="nav">')[1];
  renderDashboard();
}

function renderMatches(){
  const matches=state.matches[state.user.email]||[];
  
  app.innerHTML=`
    <div class="nav">
      <button onclick="renderSwipe()"><i class="fas fa-fire"></i> Discover</button>
      <button class="active"><i class="fas fa-heart"></i> Matches</button>
      <button onclick="renderMessages()"><i class="fas fa-envelope"></i> Messages</button>
      <button onclick="renderEditProfile()"><i class="fas fa-user"></i> Profile</button>
    </div>
    
    <div class="card">
      <h3><i class="fas fa-heart"></i> Your Matches</h3>
      ${matches.length===0?`
        <p style="text-align:center;color:#999;padding:30px 0;">
          <i class="fas fa-search" style="font-size:2em;display:block;margin-bottom:10px;"></i>
          No matches yet. Keep swiping!
        </p>
      `:`
        <div class="matches-container">
          ${matches.map(email=>{
            const profile=state.profiles.find(p=>p.email===email);
            const images=state.images[email]||[];
            const initials=(profile.name||email).split(' ').map(n=>n[0]).join('').toUpperCase();
            return `
              <div class="match-card">
                <div class="match-avatar" style="background:${images[0]?'':'linear-gradient(135deg,#667eea 0%,#764ba2 100%)'};">
                  ${images[0]?`<img src="${images[0]}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`:initials}
                </div>
                <div class="match-name">${profile.name}</div>
                <div class="match-status">Matched!</div>
                <button class="btn-primary" style="width:100%;margin-top:10px;padding:8px;font-size:0.9em;" onclick="startMessage('${email}')">
                  <i class="fas fa-envelope"></i> Message
                </button>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
}

function renderMessages(){
  const matches=state.matches[state.user.email]||[];
  
  app.innerHTML=`
    <div class="nav">
      <button onclick="renderSwipe()"><i class="fas fa-fire"></i> Discover</button>
      <button onclick="renderMatches()"><i class="fas fa-heart"></i> Matches</button>
      <button class="active"><i class="fas fa-envelope"></i> Messages</button>
      <button onclick="renderEditProfile()"><i class="fas fa-user"></i> Profile</button>
    </div>
    
    <div class="card">
      <h3><i class="fas fa-envelope"></i> Messages</h3>
      ${matches.length===0?`
        <p style="text-align:center;color:#999;padding:30px 0;">
          <i class="fas fa-comments" style="font-size:2em;display:block;margin-bottom:10px;"></i>
          No matches to message yet
        </p>
      `:`
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${matches.map(email=>{
            const profile=state.profiles.find(p=>p.email===email);
            const messages=state.messages[state.user.email]&&state.messages[state.user.email][email]?state.messages[state.user.email][email]:[];
            const lastMsg=messages.length>0?messages[messages.length-1].text:'No messages yet';
            return `
              <div style="background:#f8f9ff;padding:15px;border-radius:10px;cursor:pointer;transition:all 0.3s;" onclick="startMessage('${email}')">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <strong>${profile.name}</strong>
                  <small style="color:#999;">${new Date().toLocaleTimeString()}</small>
                </div>
                <small style="color:#666;display:block;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${lastMsg}</small>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
}

function startMessage(email){
  currentChatEmail=email;
  renderChatWindow(email);
}

function renderChatWindow(email){
  const profile=state.profiles.find(p=>p.email===email);
  const messages=state.messages[state.user.email]&&state.messages[state.user.email][email]?state.messages[state.user.email][email]:[];
  
  app.innerHTML=`
    <div style="padding:20px;height:100vh;display:flex;flex-direction:column;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #eee;">
        <h3 style="color:#667eea;margin:0;">${profile.name}</h3>
        <button class="btn-secondary" style="width:auto;padding:8px 15px;font-size:0.9em;" onclick="renderMessages()">
          <i class="fas fa-arrow-left"></i> Back
        </button>
      </div>
      
      <div style="flex:1;overflow-y:auto;margin-bottom:20px;display:flex;flex-direction:column;gap:10px;">
        ${messages.map(msg=>`
          <div style="text-align:${msg.from===state.user.email?'right':'left'};">
            <div style="display:inline-block;background:${msg.from===state.user.email?'#667eea':'#f0f0f0'};color:${msg.from===state.user.email?'white':'#333'};padding:10px 15px;border-radius:15px;max-width:70%;word-wrap:break-word;">
              ${msg.text}
            </div>
            <small style="display:block;color:#999;margin-top:3px;font-size:0.85em;">${new Date(msg.timestamp).toLocaleTimeString()}</small>
          </div>
        `).join('')}
      </div>
      
      <div style="display:flex;gap:10px;">
        <input id="messageInput" type="text" placeholder="Type a message..." style="flex:1;" onkeypress="if(event.key==='Enter') sendMessage('${email}')">
        <button class="btn-primary" style="padding:12px 20px;width:auto;" onclick="sendMessage('${email}')">
          <i class="fas fa-paper-plane"></i> Send
        </button>
      </div>
    </div>
  `;
  
  setTimeout(()=>{
    const chatDiv=document.querySelector('[style*="overflow-y:auto"]');
    if(chatDiv) chatDiv.scrollTop=chatDiv.scrollHeight;
  },100);
}

function sendMessage(email){
  const input=document.getElementById('messageInput');
  const text=input.value.trim();
  
  if(!text) return;
  
  if(!state.messages[state.user.email]) state.messages[state.user.email]={};
  if(!state.messages[state.user.email][email]) state.messages[state.user.email][email]=[];
  
  state.messages[state.user.email][email].push({
    from:state.user.email,
    text,
    timestamp:new Date().toISOString()
  });
  
  if(!state.messages[email]) state.messages[email]={};
  if(!state.messages[email][state.user.email]) state.messages[email][state.user.email]=[];
  
  state.messages[email][state.user.email].push({
    from:state.user.email,
    text,
    timestamp:new Date().toISOString()
  });
  
  save();
  input.value='';
  renderChatWindow(email);
}

function renderEditProfile(){
  const userProfile=state.profiles.find(p=>p.email===state.user.email);
  const userImages=state.images[state.user.email]||[];
  
  app.innerHTML=`
    <div class="nav">
      <button onclick="renderSwipe()"><i class="fas fa-fire"></i> Discover</button>
      <button onclick="renderMatches()"><i class="fas fa-heart"></i> Matches</button>
      <button onclick="renderMessages()"><i class="fas fa-envelope"></i> Messages</button>
      <button class="active"><i class="fas fa-user"></i> Profile</button>
    </div>
    
    <div class="card">
      <h3>Edit Profile</h3>
      
      <h4 style="color:#667eea;margin-top:20px;margin-bottom:10px;">Photos</h4>
      ${userImages.length>0?`
        <div class="image-preview">
          ${userImages.map((img,i)=>`
            <div class="preview-item">
              <img src="${img}">
              <button class="remove-btn" onclick="removeImage(${i})">×</button>
            </div>
          `).join('')}
        </div>
      `:'<p style="color:#999;">No photos yet</p>'}
      ${userImages.length<7?`
        <div class="image-upload-box" onclick="document.getElementById('editImageInput').click()" style="margin-top:10px;">
          <i class="fas fa-plus" style="font-size:2em;color:#667eea;"></i>
          <p>Add Photo</p>
        </div>
        <input type="file" id="editImageInput" accept="image/*" onchange="handleImageUpload(event)" style="display:none;">
      `:''}
      
      <h4 style="color:#667eea;margin-top:20px;margin-bottom:10px;">What Are You Looking For?</h4>
      <select id="lookingFor">
        <option value="">Select what you're looking for</option>
        <option value="Relationship" ${userProfile.lookingFor==='Relationship'?'selected':''}>Serious Relationship</option>
        <option value="Casual" ${userProfile.lookingFor==='Casual'?'selected':''}>Casual Dating</option>
        <option value="Open" ${userProfile.lookingFor==='Open'?'selected':''}>Open to Anything</option>
      </select>
      <div style="background:#f8f9ff;padding:15px;border-radius:10px;margin:15px 0;">
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
          <input type="checkbox" id="lookingForFriends" ${userProfile.lookingForFriends?'checked':''}>
          <span style="font-weight:600;color:#667eea;">Also looking to make friends</span>
        </label>
      </div>
      
      <h4 style="color:#667eea;margin-top:20px;margin-bottom:10px;">About You</h4>
      <label style="display:block;color:#666;font-weight:600;margin:10px 0;">Age Group</label>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:15px;">
        ${['18-25', '26-35', '36-45', '46-55', '56-65', '65+'].map(age=>`
          <button type="button" style="padding:10px;border:2px solid ${userProfile.age===age?'#667eea':'#ddd'};background:${userProfile.age===age?'#f0f4ff':'white'};color:${userProfile.age===age?'#667eea':'#333'};border-radius:10px;cursor:pointer;font-weight:600;transition:all 0.3s;font-size:0.9em;" onclick="selectAge('${age}')">${age}</button>
        `).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:15px;align-items:center;">
        <input id="editActualAge" type="number" placeholder="Or enter your actual age..." min="18" max="120" style="flex:1;">
        <button type="button" style="padding:10px 15px;background:#667eea;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600;white-space:nowrap;" onclick="editSelectCustomAge()">Set Age</button>
      </div>
      
      <label style="display:block;color:#666;font-weight:600;margin:15px 0 10px;">Gender</label>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:15px;">
        ${['Man', 'Woman', 'Non-binary', 'Genderqueer', 'Two-Spirit', 'Transgender Man', 'Transgender Woman', 'Agender', 'Bigender', 'Prefer to self-define', 'Prefer not to say'].map(g=>`
          <button type="button" style="padding:8px;border:2px solid ${userProfile.gender===g?'#667eea':'#ddd'};background:${userProfile.gender===g?'#f0f4ff':'white'};color:${userProfile.gender===g?'#667eea':'#333'};border-radius:8px;cursor:pointer;font-weight:600;transition:all 0.3s;font-size:0.85em;" onclick="selectGender('${g}')">${g}</button>
        `).join('')}
      </div>
      
      <label style="display:block;color:#666;font-weight:600;margin:15px 0 10px;">Orientation</label>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:15px;">
        ${['Straight/Heterosexual', 'Gay', 'Lesbian', 'Bisexual', 'Asexual', 'Aromantic', 'Demisexual', 'Graysexual', 'Pansexual', 'Polysexual', 'Queer', 'Questioning', 'Prefer to self-define', 'Prefer not to say'].map(o=>`
          <button type="button" style="padding:8px;border:2px solid ${userProfile.orientation===o?'#667eea':'#ddd'};background:${userProfile.orientation===o?'#f0f4ff':'white'};color:${userProfile.orientation===o?'#667eea':'#333'};border-radius:8px;cursor:pointer;font-weight:600;transition:all 0.3s;font-size:0.85em;" onclick="selectOrientation('${o}')">${o}</button>
        `).join('')}
      </div>
      
      <label style="display:block;color:#666;font-weight:600;margin:10px 0;">Location</label>
      <select id="location">
        <option value="">Select location</option>
        ${US_LOCATIONS.map(loc=>`<option value="${loc}" ${userProfile.location===loc?'selected':''}>${loc}</option>`).join('')}
      </select>
      
      <textarea id="bio" placeholder="Your Bio" style="resize:vertical;height:80px;margin-top:10px;">${userProfile.bio}</textarea>
      
      <button class="btn-primary" style="width:100%;margin-top:20px;" onclick="saveEditedProfile()">
        <i class="fas fa-save"></i> Save Changes
      </button>
      <button class="btn-secondary" style="width:100%;margin-top:10px;" onclick="logout()">
        <i class="fas fa-sign-out-alt"></i> Logout
      </button>
    </div>
  `;
}

function saveEditedProfile(){
  const userProfile=state.profiles.find(p=>p.email===state.user.email);
  const locationSelect=document.getElementById('location');
  const bioInput=document.getElementById('bio');
  const lookingForSelect=document.getElementById('lookingFor');
  const friendsCheckbox=document.getElementById('lookingForFriends');
  
  if(locationSelect) userProfile.location=locationSelect.value;
  if(bioInput) userProfile.bio=bioInput.value;
  if(lookingForSelect) userProfile.lookingFor=lookingForSelect.value;
  if(friendsCheckbox) userProfile.lookingForFriends=friendsCheckbox.checked;
  
  save();
  alert('Profile updated!');
  renderDashboard();
}

function logout(){
  state.user=null;
  currentStep=0;
  uploadedImages=[];
  localStorage.removeItem('jwt');
  localStorage.removeItem('userEmail');
  renderHome();
}

// Initialize session on page load
initSession();