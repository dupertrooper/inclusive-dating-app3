(async() => {
    const BASE = process.env.BASE || 'http://localhost:5000';
    const email = `smoke+${Date.now()}@example.com`;
    const password = 'Test1234';

    async function req(path, opts = {}) {
        const res = await fetch(`${BASE}${path}`, opts);
        const text = await res.text();
        let body = text;
        try { body = JSON.parse(text); } catch (e) {}
        return { status: res.status, body };
    }

    console.log('1) Health check ->', `${BASE}/api/health`);
    try {
        const health = await req('/api/health');
        console.log('   status', health.status);
        console.log('   body', health.body);
    } catch (err) {
        console.error('   Health check failed:', err.stack || err);
        process.exit(1);
    }

    console.log('2) Register ->', email);
    let register;
    try {
        register = await req('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, confirmPassword: password })
        });
        console.log('   status', register.status);
        console.log('   body', register.body);
    } catch (err) {
        console.error('   Register request failed:', err.stack || err);
    }

    console.log('3) Login ->', email);
    let token;
    try {
        const login = await req('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        console.log('   status', login.status);
        console.log('   body', login.body);
        if (login.body && (login.body.token || (login.body.data && login.body.data.token))) {
            token = login.body.token || login.body.data.token;
        } else if (login.body && login.body.user && login.body.user.token) {
            token = login.body.user.token;
        }
    } catch (err) {
        console.error('   Login request failed:', err.stack || err);
    }

    if (!token) {
        console.warn('   No token received; aborting protected route test.');
        process.exit(0);
    }

    console.log('4) Fetch profile with token');
    try {
        const profile = await req('/api/users/profile', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('   status', profile.status);
        console.log('   body', profile.body);
    } catch (err) {
        console.error('   Profile request failed:', err.stack || err);
    }

    console.log('Smoke tests finished.');
    process.exit(0);
})();