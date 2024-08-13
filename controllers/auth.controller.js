const { User } = require("../model/users.model");
const { Counter } = require("../model/counter.model");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const SibApiV3Sdk = require("sib-api-v3-sdk");
const bcrypt = require("bcrypt");
require("dotenv").config();
const jwt = require("jsonwebtoken");

async function getNextSequenceValue(sequenceName) {
  const counter = await Counter.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

async function registerUser(req, res) {
  const { username, firstname, lastname, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const userId = await getNextSequenceValue("userId");

    const user = new User({
      _id: userId,
      username,
      firstname,
      lastname,
      email,
      password,
      role,
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET
    );
    res.status(201).json({ token, userId: user._id });
  } catch (error) {
    console.error(`Error registering user: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function loginUser(req, res) {
  const { email, password, rememberMe } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Set token expiration based on rememberMe flag
    const tokenExpiration = rememberMe ? "30d" : "1d"; // Long-lived token for "remember me"

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: tokenExpiration,
      }
    );

    // Set the token as a cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    }); // 30 days expiration for "remember me"

    res.status(200).json({ token, userId: user._id, role: user.role });
  } catch (error) {
    console.error(`Error logging in user: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

// Function to send password reset email
async function sendResetEmail(email, sessionId) {
  const resetUrl = `http://localhost:8001/api/addbanao/auth/reset-password/${sessionId}`;
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.to = [{ email: email }];
  sendSmtpEmail.sender = {
    email: process.env.EMAIL_FROM,
    name: process.env.EMAIL_FROM_NAME,
  };
  sendSmtpEmail.subject = "Password Reset";
  sendSmtpEmail.htmlContent = `
    <p>You are receiving this email because you (or someone else) have requested a password reset for your account.</p>
    <p>Please click on the following link, or paste it into your browser to complete the process:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
  `;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  await apiInstance.sendTransacEmail(sendSmtpEmail);
}

// Function to handle password reset request
async function forgotPassword(req, res) {
  const { email } = req.body;

  const THREEMINUTES = 3 * 60 * 1000;
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const now = new Date();
    if (
      (
        now - user.passwordChangedAt <THREEMINUTES) ||
      now - user.registeredAt < THREEMINUTES
    ) {
      return res.status(400).json({
        error:
          "Password reset is not allowed within 5 minutes of registration or password change",
      });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const hashedResetToken = await bcrypt.hash(resetToken, 10);
    const resetTokenExpiration = Date.now() + 3600000; // 1 hour expiration

    user.resetToken = hashedResetToken;
    user.resetTokenExpiration = resetTokenExpiration;
    await user.save();

    await sendResetEmail(user.email, resetToken);

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error(`Error requesting password reset: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}


// Function to serve the reset password forms
async function resetPasswordForm(req, res) {
  const { token } = req.params;
  console.log(token);
  try {
    const user = await User.findOne({
      resetTokenExpiration: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }
    const isTokenValid = bcrypt.compare(token, user.resetToken);
    if (!isTokenValid) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }
    res.send(`
      <html>
        <body>
          <form action="/api/addbanao/auth/reset-password?token=${token}" method="POST">
            <label for="newPassword">New Password:</label>
            <input type="password" name="newPassword" required minlength="8"/>
            <label for="confirmPassword">Confirm Password:</label>
            <input type="password" name="confirmPassword" required minlength="8"/>
            <button type="submit">Reset Password</button>
          </form>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Function to handle password reset
async function resetPassword(req, res) {
  const { token } = req.query;
  const { newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  try {
    const user = await User.findOne({
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const isTokenValid = await bcrypt.compare(token, user.resetToken);
    if (!isTokenValid) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    user.password = newPassword; 
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    user.passwordChangedAt = new Date();
    await user.save();

    res.status(200).json({ message: "Password has been reset" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  forgotPassword,
  resetPasswordForm,
  resetPassword,
  registerUser,
  loginUser,
};
