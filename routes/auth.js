const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Test endpoint to verify API connection
router.get('/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Auth API is working', 
    timestamp: new Date().toISOString() 
  });
});

// Signup
router.post('/signup', authController.signup);

// Login
router.post('/login', authController.login);

module.exports = router;
