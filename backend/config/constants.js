// Application constants
module.exports = {
    // User constraints
    MIN_PASSWORD_LENGTH: 8,
    MAX_PROFILE_PHOTOS: 7,
    MAX_BIO_LENGTH: 500,

    // Email verification
    VERIFICATION_CODE_EXPIRY: 15 * 60 * 1000, // 15 minutes
    VERIFICATION_CODE_LENGTH: 6,
    MAX_VERIFICATION_ATTEMPTS: 5,

    // JWT
    JWT_EXPIRY: process.env.JWT_EXPIRE || '7d',

    // Discovery
    PROFILES_PER_PAGE: 50,
    MAX_DISTANCE_KM: 1000,

    // Age limits
    MIN_AGE: 18,
    MAX_AGE: 120,

    // Status codes
    HTTP_OK: 200,
    HTTP_CREATED: 201,
    HTTP_BAD_REQUEST: 400,
    HTTP_UNAUTHORIZED: 401,
    HTTP_FORBIDDEN: 403,
    HTTP_NOT_FOUND: 404,
    HTTP_CONFLICT: 409,
    HTTP_SERVER_ERROR: 500,

    // Messages
    MESSAGES: {
        USER_CREATED: 'User created successfully',
        LOGIN_SUCCESS: 'Logged in successfully',
        EMAIL_VERIFIED: 'Email verified successfully',
        PROFILE_UPDATED: 'Profile updated successfully',
        USER_BANNED: 'User has been banned',
        INVALID_CREDENTIALS: 'Invalid email or password',
        EMAIL_ALREADY_REGISTERED: 'Email already registered',
        USER_NOT_FOUND: 'User not found',
        INVALID_TOKEN: 'Invalid or expired token',
        UNAUTHORIZED: 'Unauthorized access',
        SERVER_ERROR: 'Internal server error',
        IT_IS_A_MATCH: 'It\'s a match!'
    }
};