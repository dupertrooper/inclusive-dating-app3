import { state, save, addAdminLog } from './state.js';
import { BACKEND_URL, fetchWithRetry, generateVerificationCode, ADMIN_EMAIL, ADMIN_PASSWORD } from './utils.js';

const app = document.getElementById('app');





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
    // Wake up backend every 10 minutes to prevent cold start
    setInterval(() => {
        fetch(`${BACKEND_URL}/api/health`).catch(() => {});
    }, 10 * 60 * 1000);

    // Initial wake-up call
    fetch(`${BACKEND_URL}/api/health`).catch(() => {});

    // Check for admin session first
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
        try {
            state.admin = JSON.parse(adminSession);
            state.user = null;
            renderAdminDashboard();
            return;
        } catch (err) {
            console.error('Error restoring admin session:', err);
            localStorage.removeItem('adminSession');
        }
    }

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

// Helper to set app HTML with smooth fade animation
function setAppHTML(html, cb) {
    app.classList.add('page-fade-out');
    setTimeout(() => {
        app.classList.remove('page-fade-out');
        app.innerHTML = html;
        app.classList.add('page-fade-in');
        setTimeout(() => app.classList.remove('page-fade-in'), 220);
        if (typeof cb === 'function') cb();
    }, 180);
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
          <button class="btn-secondary admin-btn" onclick="renderAdminLogin()">
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

    if (!email || !pass) {
        alert('Please enter admin email and password');
        return;
    }

    // Call backend admin-login to obtain a JWT for admin-protected routes
    fetch(`${BACKEND_URL}/api/auth/admin-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        })
        .then(res => res.json())
        .then(data => {
            if (data && data.token) {
                state.admin = { email: data.email };
                state.user = null;
                localStorage.setItem('adminSession', JSON.stringify(state.admin));
                localStorage.setItem('adminToken', data.token);
                addAdminLog('ADMIN_LOGIN', `Admin ${data.email} logged in`);
                renderAdminDashboard();
            } else {
                alert(data.error || 'Invalid admin credentials');
            }
        })
        .catch(err => {
            console.error('Admin login error', err);
            alert('Error logging in as admin');
        });
}

function renderAdminDashboard() {
    const allUsers = state.profiles.filter(p => p.email !== ADMIN_EMAIL);
    const bannedCount = state.bannedUsers.length;

    app.innerHTML = `
    <div class="container">
      <div class="flex-row mb-20">
        <h1 class="text-primary">💼 Admin Dashboard</h1>
        <button class="btn-secondary" onclick="adminLogout()">Logout</button>
      </div>
      
      <div class="flex-row wrap-gap gap-15 mb-30">
        <div class="stat-card center">
          <div class="stat-number text-primary">${allUsers.length}</div>
          <div>Total Users</div>
        </div>
        <div class="stat-card center">
          <div class="stat-number text-danger">${bannedCount}</div>
          <div>Banned Users</div>
        </div>
        <div class="stat-card center">
          <div class="stat-number text-primary">${state.verifiedUsers.length}</div>
          <div>Verified Users</div>
        </div>
      </div>
      
      <div class="flex-row justify-end gap-10 mb-10">
        <button class="btn-secondary erase-btn" onclick="confirmEraseEmails()">Erase All Emails</button>
      </div>
      
      <div class="admin-section mb-20">
        <h3 class="text-primary">Manage Users</h3>
        <div class="user-list" style="max-height:400px;overflow-y:auto;">
          ${allUsers.map(user => `
            <div class="user-row">
              <div class="user-info">
                <strong>${user.name}</strong>
                <small class="text-muted">${user.email}</small>
                <small class="text-primary">${user.age} • ${user.gender}</small>
              </div>
              <div class="user-actions">
                ${state.bannedUsers.includes(user.email)?`
                  <button class="btn-secondary unban-btn" onclick="unbanUser('${user.email}')">Unban</button>
                `:`
                  <button class="btn-secondary ban-btn" onclick="banUser('${user.email}')">Ban</button>
                `}
                <button class="btn-secondary delete-photos-btn" onclick="adminDeletePhotos('${user.email}')">Delete Photos</button>
                <button class="btn-secondary view-photos-btn" onclick="adminViewPhotos('${user.email}')">View Photos</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="admin-section mb-20">
        <h3 class="text-primary mb-0">Admin Logs</h3>
        <div class="log-container" style="max-height:300px;overflow-y:auto;">
          ${state.adminLogs.slice(-20).reverse().map(log => `
            <div class="log-entry">
              <strong>${log.action}</strong> - ${log.details}<br>
              <small>${new Date(log.timestamp).toLocaleString()}</small>
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
  if (!confirm(`Delete all photos for ${email}?`)) return;
  const token = localStorage.getItem('adminToken');
  if (!token) {
    alert('Admin token missing. Please log in again.');
    renderAdminLogin();
    return;
  }

  // Attempt to find userId from local profiles by email
  const user = state.profiles.find(p => (p.email||'').toLowerCase() === (email||'').toLowerCase());
  const userId = user ? user._id || user.id : null;

  if (!userId) {
    // If we don't have userId locally, try to call admin users endpoint to find it
    fetch(`${BACKEND_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        const found = (data.users||[]).find(u => (u.email||'').toLowerCase() === (email||'').toLowerCase());
        if (found) {
          return fetch(`${BACKEND_URL}/api/admin/photos/${found._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        } else {
          throw new Error('User not found on server');
        }
      })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          addAdminLog('DELETE_PHOTOS', `Deleted photos for: ${email}`);
          // clear local copy if present
          state.images[email] = [];
          save();
          renderAdminDashboard();
        } else {
          alert(result.error || 'Failed to delete photos');
        }
      })
      .catch(err => { console.error('Delete photos error', err); alert('Error deleting photos'); });
    return;
  }

  fetch(`${BACKEND_URL}/api/admin/photos/${userId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    .then(res => res.json())
    .then(result => {
    if (result.success) {
      addAdminLog('DELETE_PHOTOS', `Deleted photos for: ${email}`);
      state.images[email] = [];
      save();
      renderAdminDashboard();
    } else {
      alert(result.error || 'Failed to delete photos');
    }
    })
    .catch(err => { console.error('Delete photos error', err); alert('Error deleting photos'); });
}

function confirmEraseEmails(){
  if(!confirm('This will clear the email address for every user in the database. This action cannot be undone. Proceed?')) return;
  const token = localStorage.getItem('adminToken');
  if (!token) { alert('Admin token missing. Please log in again.'); renderAdminLogin(); return; }

  fetch(`${BACKEND_URL}/api/admin/erase-emails`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    .then(res=>res.json())
    .then(data=>{
      if(data.success){
        alert('All emails erased.');
        // also clear local copies
        state.profiles = state.profiles.map(p=>({ ...p, email: '' }));
        save();
        renderAdminDashboard();
      } else {
        alert(data.error || 'Failed to erase emails');
      }
    })
    .catch(err=>{
      console.error('Erase emails error', err);
      alert('Error erasing emails');
    });
}

function adminLogout() {
    state.admin = null;
    // Clear admin session
    localStorage.removeItem('adminSession');
    renderHome();
}

function adminViewPhotos(email){
  const token = localStorage.getItem('adminToken');
  const modal = document.createElement('div');
  modal.id = 'adminPhotoModal';
  modal.style.position='fixed';
  modal.style.top='0'; modal.style.left='0'; modal.style.width='100%'; modal.style.height='100%';
  modal.style.background='rgba(0,0,0,0.6)'; modal.style.display='flex'; modal.style.alignItems='center'; modal.style.justifyContent='center';
  modal.style.zIndex='9999';
  const inner = document.createElement('div');
  inner.style.width='95%'; inner.style.maxWidth='1100px'; inner.style.maxHeight='86%'; inner.style.overflowY='auto'; inner.style.background='white'; inner.style.borderRadius='12px'; inner.style.padding='18px';
  inner.innerHTML = `<div class="flex-row mb-20"><h3>All Uploaded Photos</h3><div><button class="btn-secondary erase-btn" onclick="closeAdminPhotosModal()">Close</button></div></div>`;

  // Try to fetch photos from backend (requires admin token), fallback to local state
  const fetchPhotos = () => {
    if (!token) return Promise.reject(new Error('No admin token'));
    return fetch(`${BACKEND_URL}/api/admin/photos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (!data.success) throw new Error(data.error || 'Failed to load photos');
        return data.photos || [];
      });
  };

  fetchPhotos().catch(() => {
    // build from local state as fallback
    const users = Object.keys(state.images||{}).map(emailKey => ({
      email: emailKey,
      fullName: (state.profiles.find(p=> (p.email||'').toLowerCase()===(emailKey||'').toLowerCase())||{}).name || '',
      photos: state.images[emailKey]
    }));
    return users;
  }).then(allUsers => {
    if (!allUsers || allUsers.length===0) {
      inner.innerHTML += '<p class="text-muted">No photos uploaded</p>';
      modal.appendChild(inner);
      document.body.appendChild(modal);
      return;
    }

    const grid = document.createElement('div');
    grid.style.display='grid'; grid.style.gridTemplateColumns='repeat(auto-fit,minmax(180px,1fr))'; grid.style.gap='14px';

    allUsers.forEach(user => {
      const userBlock = document.createElement('div');
      userBlock.style.background='#fafafa'; userBlock.style.borderRadius='10px'; userBlock.style.padding='10px';
      userBlock.style.boxShadow='0 6px 18px rgba(0,0,0,0.06)';
      userBlock.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><div><strong>${user.fullName||'No name'}</strong><br><small class="text-muted">${user.email||''}</small></div><div></div></div>`;

      const photosGrid = document.createElement('div');
      photosGrid.style.display='grid'; photosGrid.style.gridTemplateColumns='repeat(auto-fill,minmax(120px,1fr))'; photosGrid.style.gap='8px';

      (user.photos||[]).forEach((p, idx) => {
        const cell = document.createElement('div');
        cell.style.position='relative'; cell.style.overflow='hidden'; cell.style.borderRadius='8px';
        const img = document.createElement('img'); img.src = p.url || p; img.style.width='100%'; img.style.height='120px'; img.style.objectFit='cover';
        const del = document.createElement('button'); del.textContent='Delete'; del.className='btn-secondary'; del.style.position='absolute'; del.style.top='8px'; del.style.right='8px'; del.style.padding='6px 8px'; del.onclick = () => {
          if (!confirm('Delete this photo?')) return;
          // currently backend supports deleting all photos for a user; warn and call that
          if (!token) { alert('Admin token missing'); return; }
          // Find user's id then call DELETE /api/admin/photos/:userId
          fetch(`${BACKEND_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => {
              const found = (d.users||[]).find(u => (u.email||'').toLowerCase() === (user.email||'').toLowerCase());
              if (!found) throw new Error('User not found');
              return fetch(`${BACKEND_URL}/api/admin/photos/${found._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            })
            .then(r => r.json())
            .then(res => {
              if (res.success) {
                addAdminLog('DELETE_PHOTOS', `Deleted photos for ${user.email}`);
                // refresh modal
                closeAdminPhotosModal();
                adminViewPhotos();
              } else {
                alert(res.error || 'Failed to delete photos');
              }
            })
            .catch(err => { console.error(err); alert('Error deleting photos'); });
        };

        cell.appendChild(img);
        cell.appendChild(del);
        photosGrid.appendChild(cell);
      });

      userBlock.appendChild(photosGrid);
      grid.appendChild(userBlock);
    });

    inner.appendChild(grid);
    modal.appendChild(inner);
    document.body.appendChild(modal);
  }).catch(err => {
    console.error('Error loading admin photos', err);
    inner.innerHTML += '<p class="text-muted">Unable to load photos</p>';
    modal.appendChild(inner);
    document.body.appendChild(modal);
  });
}

function closeAdminPhotosModal(){
  const m=document.getElementById('adminPhotoModal'); if(m) m.remove();
}

function adminDeletePhoto(email,index){
  const imgs=state.images[email]||[];
  if(index<0||index>=imgs.length) return;
  imgs.splice(index,1);
  state.images[email]=imgs;
  addAdminLog('DELETE_PHOTO', `Deleted photo ${index} for ${email}`);
  save();
  closeAdminPhotosModal();
  adminViewPhotos(email);
}

function renderAgeGate() {
    app.innerHTML = `
    <div class="auth-container">
      <div class="card text-center p-40">
        <h2 class="text-primary mb-20">❌ Age Verification Required</h2>
        <p class="mb-30 text-muted">
          We're sorry, but you must be at least 18 years old to use Heart Dating.
        </p>
        <p class="text-muted mb-30">
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

  // Call backend API with retry
  fetchWithRetry(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass, name })
  }, 3)
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
    
    // If user is already verified (email verification disabled), skip to profile setup
    if (data.isVerified) {
      currentStep = 0;
      renderProfileSetup();
    } else {
      renderEmailVerification(email.toLowerCase());
    }
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
    <div class="card text-center p-30">
      <h3 class="text-primary mb-0">✉️ Verify Your Email</h3>
      <p class="text-muted mb-15 fs-1-05">
        A verification code has been sent to:<br>
        <strong class="text-primary">${email}</strong>
      </p>
      <div class="info-box p-15">
        <p class="mb-0 text-muted fs-0-95"><strong>Check your email:</strong></p>
        <p class="text-muted mb-0" style="font-size:0.9em;">Look for an email from Heart Dating App and enter the 6-digit code below</p>
      </div>
      <input id="verificationCode" type="text" placeholder="Enter 6-digit code" maxlength="6" class="text-center" style="letter-spacing:8px;font-size:1.5em;">
      <button class="btn-primary w-100" onclick="verifyEmail()">
        <i class="fas fa-check"></i> Verify
      </button>
      <button class="btn-secondary w-100 mt-10" onclick="renderHome()">← Back Home</button>
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
    
    // Call backend API with retry
    fetchWithRetry(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
    }, 3)
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
        alert('Error logging in. Server may be starting up - please try again.');
    });
}

function renderProfileSetup() {
    const progress = (currentStep + 1) / profileSteps.length * 100;
    const step = profileSteps[currentStep];
    let userProfile = state.profiles.find(p => p.email === state.user.email);
    
    // Create profile if it doesn't exist yet (new signup)
    if (!userProfile) {
        userProfile = {
            email: state.user.email,
            name: '',
            age: null,
            gender: null,
            orientation: null,
            interests: [],
            customInterests: [],
            location: '',
            photos: [],
            bio: ''
        };
        state.profiles.push(userProfile);
        save();
    }

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
            <button type="button" data-group="age" data-value="${age}" style="padding:10px;border:2px solid ${userProfile.age===age?'#667eea':'#ddd'};background:${userProfile.age===age?'#f0f4ff':'white'};color:${userProfile.age===age?'#667eea':'#333'};border-radius:10px;cursor:pointer;font-weight:600;transition:all 0.3s;font-size:0.9em;" onclick="selectAge(this,'${age}')">${age}</button>
          `).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-bottom:15px;align-items:center;">
          <input id="actualAge" type="number" placeholder="Or enter your actual age..." min="18" max="120" style="flex:1;">
          <button type="button" style="padding:10px 15px;background:#667eea;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600;white-space:nowrap;" onclick="selectCustomAge()">Set Age</button>
        </div>
        
        <label style="display:block;color:#666;font-weight:600;margin:15px 0 10px;">Gender</label>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:15px;">
          ${genderOptions.map(g=>`
            <button type="button" data-group="gender" data-value="${g}" style="padding:10px;border:2px solid ${userProfile.gender===g?'#667eea':'#ddd'};background:${userProfile.gender===g?'#f0f4ff':'white'};color:${userProfile.gender===g?'#667eea':'#333'};border-radius:10px;cursor:pointer;font-weight:600;transition:all 0.3s;font-size:0.9em;" onclick="selectGender(this,'${g}')">${g}</button>
          `).join('')}
        </div>
        
        <label style="display:block;color:#666;font-weight:600;margin:15px 0 10px;">Orientation</label>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:15px;">
          ${orientationOptions.map(o=>`
            <button type="button" data-group="orientation" data-value="${o}" style="padding:10px;border:2px solid ${userProfile.orientation===o?'#667eea':'#ddd'};background:${userProfile.orientation===o?'#f0f4ff':'white'};color:${userProfile.orientation===o?'#667eea':'#333'};border-radius:10px;cursor:pointer;font-weight:600;transition:all 0.3s;font-size:0.9em;" onclick="selectOrientation(this,'${o}')">${o}</button>
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
            <button type="button" data-group="interest" data-value="${interest}" style="background:${userProfile.interests.includes(interest)?'linear-gradient(135deg,#667eea 0%,#764ba2 100%)':'#f0f0f0'};color:${userProfile.interests.includes(interest)?'white':'#333'};border:none;padding:8px 12px;border-radius:20px;cursor:pointer;transition:all 0.3s;font-size:0.9em;" onclick="toggleInterest(this,'${interest}')">${interest}</button>
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

function selectGender(el, gender){
  const userProfile=state.profiles.find(p=>p.email===state.user.email);
  if(!userProfile) return;
  userProfile.gender=gender;
  save();
  const buttons=document.querySelectorAll('button[data-group="gender"]');
  buttons.forEach(b=>{
    if(b.dataset.value===gender){b.style.borderColor='#667eea'; b.style.background='#f0f4ff'; b.style.color='#667eea';}
    else{b.style.borderColor='#ddd'; b.style.background='white'; b.style.color='#333';}
  });
}

function selectOrientation(el, orientation){
  const userProfile=state.profiles.find(p=>p.email===state.user.email);
  if(!userProfile) return;
  userProfile.orientation=orientation;
  save();
  const buttons=document.querySelectorAll('button[data-group="orientation"]');
  buttons.forEach(b=>{
    if(b.dataset.value===orientation){b.style.borderColor='#667eea'; b.style.background='#f0f4ff'; b.style.color='#667eea';}
    else{b.style.borderColor='#ddd'; b.style.background='white'; b.style.color='#333';}
  });
}

function selectAge(el, ageGroup){
  const userProfile=state.profiles.find(p=>p.email===state.user.email);
  if(!userProfile) return;
  userProfile.age=ageGroup;
  save();
  const buttons=document.querySelectorAll('button[data-group="age"]');
  buttons.forEach(b=>{
    if(b.dataset.value===ageGroup){b.style.borderColor='#667eea'; b.style.background='#f0f4ff'; b.style.color='#667eea';}
    else{b.style.borderColor='#ddd'; b.style.background='white'; b.style.color='#333';}
  });
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

function toggleInterest(el, interest){
  const userProfile=state.profiles.find(p=>p.email===state.user.email);
  if(!userProfile) return;
  const idx=userProfile.interests.indexOf(interest);
  if(idx>-1){
    userProfile.interests.splice(idx,1);
    if(el){el.style.background='#f0f0f0'; el.style.color='#333';}
  }else if(userProfile.interests.length<5){
    userProfile.interests.push(interest);
    if(el){el.style.background='linear-gradient(135deg,#667eea 0%,#764ba2 100%)'; el.style.color='white';}
  }else{
    alert('Maximum 5 interests');
    return;
  }
  save();
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
      <div style="padding:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <h2 style="color:#667eea;margin:0;">Discover</h2>
          <button class="btn-secondary" style="width:auto;" onclick="renderDashboard()"><i class="fas fa-arrow-left"></i> Back</button>
        </div>
        <div class="card" style="text-align:center;padding:40px 20px;">
          <i class="fas fa-search" style="font-size:3em;color:#ddd;margin-bottom:10px;display:block;"></i>
          <p style="color:#999;">No profiles to discover yet. Check back soon as more people join!</p>
        </div>
      </div>
    `;
    return;
  }
  
  const profile=others[0];
  const images=state.images[profile.email]||[];
  const displayName = profile.name || profile.email || 'User';
  const displayAge = profile.age || 'Age not set';
  const mainImage=images[0]?`<img src="${images[0]}" style="width:100%;height:100%;object-fit:cover;">`:`<i class="fas fa-user" style="font-size:2em;color:white;"></i>`;
  
  app.innerHTML=`
    <div style="padding:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h2 style="color:#667eea;margin:0;">Discover</h2>
        <button class="btn-secondary" style="width:auto;" onclick="renderDashboard()"><i class="fas fa-arrow-left"></i> Back</button>
      </div>
      <div class="swipe-container" id="swiperContainer">
        <div class="swipe-card" id="swipeCard" data-email="${profile.email}" data-photo="0" data-total="${images.length}" style="transform:translateX(0) rotate(0deg);cursor:pointer;">
          <div class="card-image photo-display" onclick="nextPhoto('${profile.email}')" style="position:relative;">
            ${mainImage}
            ${images.length>1?`<div style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.5);color:white;padding:6px 12px;border-radius:20px;font-size:0.85em;font-weight:600;">1/${images.length}</div>`:''} 
          </div>
          <div class="card-info">
            <div class="card-name">${displayName}, ${displayAge}</div>
            <div class="card-details">${profile.gender || 'Not specified'} • ${profile.orientation || 'Not specified'}${profile.lookingForFriends?' • 👥 Wants friends':''}</div>
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
  if (!state.user || !state.user.email) {
    renderHome();
    return;
  }

  let userProfile = state.profiles.find(p=>p.email===state.user.email);
  const userImages = state.images[state.user.email]||[];

  if (!userProfile) {
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      fetch(`${BACKEND_URL}/api/users/profile`, { headers: { 'Authorization': `Bearer ${jwt}` } })
        .then(res => res.ok ? res.json() : Promise.reject('Failed to load profile'))
        .then(data => {
          const fetched = data.profile || data.user || data;
          if (fetched && fetched.email) {
            fetched.email = fetched.email.toLowerCase();
            state.profiles = state.profiles.filter(p => p.email !== fetched.email).concat(fetched);
            save();
            renderMatches();
            return;
          }
          currentStep = 0;
          renderProfileSetup();
        })
        .catch(err => {
          console.error('Failed to fetch profile:', err);
          currentStep = 0;
          renderProfileSetup();
        });
      return;
    }
    renderHome();
    return;
  }

  // normalize name fields
  if (!userProfile.name && userProfile.fullName) userProfile.name = userProfile.fullName;
  const displayName = (userProfile.name || userProfile.fullName || userProfile.email || '').toString();
  const initials = displayName.split(' ').filter(Boolean).map(n=>n[0]).join('').toUpperCase() || displayName.slice(0,2).toUpperCase();

  // Get mutual matches (both users liked each other)
  const userLikes = state.likes[state.user.email] || [];
  const matchedEmails = userLikes.filter(liked => {
    const theirLikes = state.likes[liked] || [];
    return theirLikes.includes(state.user.email);
  });

  const matchProfiles = matchedEmails.map(email => state.profiles.find(p => p.email === email)).filter(Boolean);

  app.innerHTML=`
    <div class="nav">
      <button onclick="renderSwipe()"><i class="fas fa-fire"></i> Discover</button>
      <button class="active" onclick="renderMatches()"><i class="fas fa-heart"></i> Matches</button>
      <button onclick="renderMessages()"><i class="fas fa-envelope"></i> Messages</button>
      <button onclick="renderEditProfile()"><i class="fas fa-user"></i> Profile</button>
    </div>
    
    <div class="profile-header">
      <div class="user-info">
        <div class="user-avatar">${userImages[0]?`<img src="${userImages[0]}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`:initials}</div>
        <div class="user-details">
          <h3>${displayName}${userProfile.age?`, ${userProfile.age}`:''}</h3>
          <p><i class="fas fa-map-marker-alt"></i> ${userProfile.location||''}</p>
        </div>
      </div>
    </div>

    <div class="content">
      <h2 style="color:#667eea;text-align:center;margin:20px 0;">${matchProfiles.length > 0 ? '💕 Your Matches' : '💔 No Matches Yet'}</h2>
      ${matchProfiles.length === 0 ? `
        <div style="text-align:center;padding:40px 20px;color:#999;">
          <p>No matches yet. Keep swiping to find your perfect match!</p>
          <button class="btn-primary" onclick="renderSwipe()" style="margin-top:20px;">
            <i class="fas fa-fire"></i> Start Swiping
          </button>
        </div>
      ` : `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;padding:20px;">
          ${matchProfiles.map(match => {
            const matchImages = state.images[match.email] || [];
            const initials = (match.name || match.email || '').split(' ').filter(Boolean).map(n=>n[0]).join('').toUpperCase();
            return `
              <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 5px 15px rgba(0,0,0,0.1);">
                <div style="height:200px;background:#f0f0f0;position:relative;overflow:hidden;">
                  ${matchImages[0] ? `<img src="${matchImages[0]}" style="width:100%;height:100%;object-fit:cover;">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3em;color:#ddd;">${initials}</div>`}
                </div>
                <div style="padding:15px;">
                  <h3 style="margin:0 0 8px 0;color:#333;">${match.name || match.email}${match.age ? `, ${match.age}` : ''}</h3>
                  <p style="margin:0;color:#666;font-size:0.9em;"><i class="fas fa-map-marker-alt"></i> ${match.location || 'Location not set'}</p>
                  <p style="margin:8px 0 0 0;color:#667eea;font-size:0.85em;">${match.interests ? match.interests.slice(0,3).join(', ') : 'No interests'}</p>
                  <button class="btn-primary" style="width:100%;margin-top:12px;" onclick="renderMessages()">
                    <i class="fas fa-envelope"></i> Message
                  </button>
                </div>
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
          <button type="button" data-group="age" data-value="${age}" style="padding:10px;border:2px solid ${userProfile.age===age?'#667eea':'#ddd'};background:${userProfile.age===age?'#f0f4ff':'white'};color:${userProfile.age===age?'#667eea':'#333'};border-radius:10px;cursor:pointer;font-weight:600;transition:all 0.3s;font-size:0.9em;" onclick="selectAge(this,'${age}')">${age}</button>
        `).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:15px;align-items:center;">
        <input id="editActualAge" type="number" placeholder="Or enter your actual age..." min="18" max="120" style="flex:1;">
        <button type="button" style="padding:10px 15px;background:#667eea;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600;white-space:nowrap;" onclick="editSelectCustomAge()">Set Age</button>
      </div>
      
      <label style="display:block;color:#666;font-weight:600;margin:15px 0 10px;">Gender</label>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:15px;">
        ${['Man', 'Woman', 'Non-binary', 'Genderqueer', 'Two-Spirit', 'Transgender Man', 'Transgender Woman', 'Agender', 'Bigender', 'Prefer to self-define', 'Prefer not to say'].map(g=>`
          <button type="button" data-group="gender" data-value="${g}" style="padding:8px;border:2px solid ${userProfile.gender===g?'#667eea':'#ddd'};background:${userProfile.gender===g?'#f0f4ff':'white'};color:${userProfile.gender===g?'#667eea':'#333'};border-radius:8px;cursor:pointer;font-weight:600;transition:all 0.3s;font-size:0.85em;" onclick="selectGender(this,'${g}')">${g}</button>
        `).join('')}
      </div>
      
      <label style="display:block;color:#666;font-weight:600;margin:15px 0 10px;">Orientation</label>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:15px;">
        ${['Straight/Heterosexual', 'Gay', 'Lesbian', 'Bisexual', 'Asexual', 'Aromantic', 'Demisexual', 'Graysexual', 'Pansexual', 'Polysexual', 'Queer', 'Questioning', 'Prefer to self-define', 'Prefer not to say'].map(o=>`
          <button type="button" data-group="orientation" data-value="${o}" style="padding:8px;border:2px solid ${userProfile.orientation===o?'#667eea':'#ddd'};background:${userProfile.orientation===o?'#f0f4ff':'white'};color:${userProfile.orientation===o?'#667eea':'#333'};border-radius:8px;cursor:pointer;font-weight:600;transition:all 0.3s;font-size:0.85em;" onclick="selectOrientation(this,'${o}')">${o}</button>
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