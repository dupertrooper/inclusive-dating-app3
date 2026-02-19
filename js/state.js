export const state = {
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

export function save() {
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

export function addAdminLog(action, details) {
    state.adminLogs.push({
        timestamp: new Date().toISOString(),
        admin: state.admin,
        action,
        details
    });
    save();
}