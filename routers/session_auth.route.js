const express = require('express');
const router = express.Router();
const sessionAuthController = require('../controllers/session_authController');
const sessionAuthMiddleware = require('../middleware/session_authMiddleware');

router.post('/register', sessionAuthController.register);
router.post('/login', sessionAuthController.login);
router.post('/logout', sessionAuthMiddleware.isAuthenticated, sessionAuthController.logout);

module.exports = router;
