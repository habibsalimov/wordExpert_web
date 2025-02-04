const express = require('express');
const router = express.Router();
const translationController = require('./translationController');
const authController = require('./authController');

// Auth routes
router.post('/token', authController.login);
router.post('/token/refresh', authController.refreshToken);

// Translation route
router.post('/translate', translationController.translate);

// Health check route
router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

module.exports = router;