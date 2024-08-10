const express = require("express");
const { forgotPassword ,resetPasswordForm , resetPassword ,  registerUser, loginUser } = require("../controllers/auth.controller");

const{validateResetToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token', resetPasswordForm); // Serve the reset form
router.post('/reset-password', validateResetToken, resetPassword); // Handle form submission

module.exports = router;
