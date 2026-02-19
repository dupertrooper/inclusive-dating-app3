export const BACKEND_URL = 'https://inclusive-dating-app3.onrender.com';

// Admin credentials (for frontend-only gating; backend secures separately)
export const ADMIN_EMAIL = 'mbryce385@gmail.com';
export const ADMIN_PASSWORD = 'Iamthebest101x';

// Retry helper for failed fetches (handles Render cold starts)
export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await Promise.race([
                fetch(url, options),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 25000))
            ]);
            return response;
        } catch (err) {
            lastError = err;
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt - 1) * 1000;
                console.log(`Attempt ${attempt} failed (${err.message}). Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError || new Error('Failed after retries');
}

export function generateVerificationCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}