const express = require('express');
const axios = require('axios');

const router = express.Router();

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

// @route GET /api/spotify/login
// @desc Redirect to Spotify authorization
router.get('/login', (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.SPOTIFY_CLIENT_ID,
        response_type: 'code',
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        scope: 'user-read-private user-read-email'
    });

    res.redirect(`${SPOTIFY_AUTH_URL}?${params}`);
});

// @route GET /api/spotify/callback
// @desc Handle Spotify callback
router.get('/callback', async(req, res) => {
    try {
        const { code, error } = req.query;

        if (error) {
            return res.redirect(`${process.env.FRONTEND_URL}?error=${error}`);
        }

        // Exchange code for token
        const tokenResponse = await axios.post(SPOTIFY_TOKEN_URL,
            new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
                client_id: process.env.SPOTIFY_CLIENT_ID,
                client_secret: process.env.SPOTIFY_CLIENT_SECRET
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );

        const { access_token, refresh_token } = tokenResponse.data;

        // Get user profile
        const userResponse = await axios.get(`${SPOTIFY_API_URL}/me`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });

        const spotifyUser = userResponse.data;

        // Redirect to frontend with token or create backend session
        res.redirect(`${process.env.FRONTEND_URL}?spotify_token=${access_token}&spotify_user=${encodeURIComponent(JSON.stringify(spotifyUser))}`);
    } catch (error) {
        console.error('Spotify callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}?error=spotify_auth_failed`);
    }
});

// @route GET /api/spotify/user
// @desc Get Spotify user profile
router.get('/user', async(req, res) => {
    try {
        const { access_token } = req.query;

        if (!access_token) {
            return res.status(400).json({ error: 'Access token required' });
        }

        const response = await axios.get(`${SPOTIFY_API_URL}/me`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });

        res.json({ success: true, user: response.data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;