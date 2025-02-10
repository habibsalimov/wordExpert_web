const express = require('express');
const router = express.Router();
const translationController = require('./translationController');
const authController = require('./authController');

// Auth routes
router.post('/token', authController.login);
router.post('/token/refresh', authController.refreshToken);

// Token verification endpoint
router.get('/verify-token', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        // Token'ı verify et
        // Not: Burada actual token verification logic'inizi kullanın
        // Örnek olarak basit bir kontrol:
        if (!token) {
            throw new Error('Invalid token');
        }
        res.json({ valid: true });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Translation route
router.post('/translate', translationController.translate);

// Health check route
router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

module.exports = router;