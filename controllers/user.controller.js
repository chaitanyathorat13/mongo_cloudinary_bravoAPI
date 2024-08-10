const { User } = require("../model/users.model");

async function getAllUsers(req, res) {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (error) {
    console.error(`Error fetching users: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getUserProfile(req, res) {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json(user);
  } catch (error) {
    console.error(`Error fetching user profile: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Update user profile
async function updateUserProfile(req, res) {
  const { username, email } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (username) user.username = username;
    if (email) user.email = email;
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    console.error(`Error updating user profile: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(`Error changing password: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Reset password
async function resetPassword(req, res) {
  const { email, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(`Error resetting password: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Add role
async function addRole(req, res) {
  const { userId, role } = req.body;
  try {
    const user = await User.findById(userId);
    user.role = role;
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    console.error(`Error adding role: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Remove role
async function removeRole(req, res) {
  const { userId } = req.body;
  try {
    const user = await User.findById(userId);
    user.role = "user";
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    console.error(`Error removing role: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Activate user account
async function activateUser(req, res) {
  const { userId } = req.body;
  try {
    const user = await User.findById(userId);
    user.active = true;
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    console.error(`Error activating user: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Deactivate user account
async function deactivateUser(req, res) {
  const { userId } = req.body;
  try {
    const user = await User.findById(userId);
    user.active = false;
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    console.error(`Error deactivating user: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  changePassword,
  resetPassword,
  addRole,
  removeRole,
  activateUser,
  deactivateUser,
};
