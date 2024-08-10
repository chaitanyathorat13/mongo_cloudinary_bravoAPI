

const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth.middleware");
const uploadMiddleware = require("../middleware/upload.middleware");
const photoController = require("../controllers/photo.controller");

router.post('/upload', authMiddleware, (next) => {
    console.log('Uploading files...');
    next();
}, uploadMiddleware.array('photos', 10), (req, next) => {
    console.log('Files received:', req.files);
    next();
}, photoController.uploadPhoto);

module.exports = router;
