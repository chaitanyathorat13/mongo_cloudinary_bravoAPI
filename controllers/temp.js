










// const mongoose = require("mongoose");
// const bcrypt = require("bcrypt");

// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true },
//   firstname: { type: String, required: true },
//   lastname: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   role: { type: String, required: true },
//   resetToken: String,
//   resetTokenExpiration: Date,
//   passwordChangedAt: Date,
//   registeredAt: { type: Date, default: Date.now },
// });

// // Hash password before saving
// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

// // Update passwordChangedAt field
// userSchema.methods.updatePasswordChangedAt = function() {
//   this.passwordChangedAt = new Date();
// };

// const User = mongoose.model("User", userSchema);

// module.exports = { User };




// controller 


// const bcrypt = require("bcrypt");
// const crypto = require("crypto");
// const { User } = require("../model/users.model");
// const SibApiV3Sdk = require("sib-api-v3-sdk");
// require("dotenv").config();

// async function forgotPassword(req, res) {
//   const { email } = req.body;
//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const now = new Date();
//     if (user.passwordChangedAt && (now - user.passwordChangedAt < 5 * 60 * 1000) ||
//         (now - user.registeredAt < 5 * 60 * 1000)) {
//       return res.status(400).json({ error: "Password reset is not allowed within 5 minutes of registration or password change." });
//     }

//     const resetToken = crypto.randomBytes(20).toString("hex");
//     const hashedResetToken = await bcrypt.hash(resetToken, 10);
//     const resetTokenExpiration = Date.now() + 3600000; // 1 hour expiration

//     user.resetToken = hashedResetToken;
//     user.resetTokenExpiration = resetTokenExpiration;
//     await user.save();

//     await sendResetEmail(user.email, resetToken);
//     res.status(200).json({ message: "Password reset email sent" });
//   } catch (error) {
//     console.error(`Error requesting password reset: ${error}`);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }

// async function sendResetEmail(email, token) {
//   const resetUrl = `http://localhost:8001/api/addbanao/auth/reset-password?token=${token}`;
//   const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
//   sendSmtpEmail.to = [{ email: email }];
//   sendSmtpEmail.sender = { email: process.env.EMAIL_FROM, name: process.env.EMAIL_FROM_NAME };
//   sendSmtpEmail.subject = "Password Reset";
//   sendSmtpEmail.htmlContent = `
//     <p>You are receiving this email because you (or someone else) requested a password reset for your account.</p>
//     <p>Please click on the following link, or paste it into your browser to complete the process:</p>
//     <p><a href="${resetUrl}">${resetUrl}</a></p>
//     <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
//   `;
//   const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
//   await apiInstance.sendTransacEmail(sendSmtpEmail);
// }

// async function registerUser(req, res) {
//   const { username, firstname, lastname, email, password, role } = req.body;

//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ error: "Email already in use" });
//     }

//     const user = new User({ username, firstname, lastname, email, password, role });
//     user.registeredAt = new Date();
//     await user.save();

//     res.status(201).json({ message: "User registered successfully" });
//   } catch (error) {
//     console.error(`Error registering user: ${error}`);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }

// async function resetPassword(req, res) {
//   const { token } = req.query;
//   const { newPassword, confirmPassword } = req.body;

//   if (newPassword !== confirmPassword) {
//     return res.status(400).json({ error: "Passwords do not match" });
//   }

//   try {
//     const user = await User.findOne({
//       resetTokenExpiration: { $gt: Date.now() }
//     });

//     if (!user) {
//       return res.status(400).json({ error: "Invalid or expired token" });
//     }

//     const isTokenValid = await bcrypt.compare(token, user.resetToken);
//     if (!isTokenValid) {
//       return res.status(400).json({ error: "Invalid or expired token" });
//     }

//     user.password = newPassword; // Assume you have a pre-save hook to hash the password
//     user.resetToken = undefined;
//     user.resetTokenExpiration = undefined;
//     user.passwordChangedAt = new Date();
//     await user.save();

//     res.status(200).json({ message: "Password has been reset" });
//   } catch (error) {
//     console.error(`Error resetting password: ${error}`);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }

// module.exports = { forgotPassword, registerUser, resetPassword };

// middleware=----------------------------------------------------------------------------------

// const bcrypt = require("bcrypt");
// const { User } = require("../model/users.model");

// const validateResetToken = async (req, res, next) => {
//   const { token } = req.query;

//   if (!token) {
//     return res.status(400).json({ error: "Token is required" });
//   }

//   try {
//     const user = await User.findOne({
//       resetTokenExpiration: { $gt: Date.now() }
//     });

//     if (!user) {
//       return res.status(400).json({ error: "Invalid or expired token" });
//     }

//     const isTokenValid = await bcrypt.compare(token, user.resetToken);
//     if (!isTokenValid) {
//       return res.status(400).json({ error: "Invalid or expired token" });
//     }

//     req.user = user; // Attach user to request object
//     next();
//   } catch (error) {
//     console.error(`Error validating reset token: ${error}`);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// module.exports = { validateResetToken };




// -------------------------------------------------------------------------






// const { User } = require("../model/users.model");
// const { Counter } = require("../model/counter.model");
// const crypto = require("crypto");
// const SibApiV3Sdk = require("sib-api-v3-sdk");
// const bcrypt = require("bcrypt");
// require("dotenv").config();
// const jwt = require("jsonwebtoken");

// async function getNextSequenceValue(sequenceName) {
//   const counter = await Counter.findByIdAndUpdate(
//     sequenceName,
//     { $inc: { seq: 1 } },
//     { new: true, upsert: true }
//   );
//   return counter.seq;
// }

// async function registerUser(req, res) {
//   const { username, firstname, lastname, email, password, role } = req.body;

//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ error: "Email already in use" });
//     }

//     const userId = await getNextSequenceValue("userId");

//     const user = new User({
//       _id: userId,
//       username,
//       firstname,
//       lastname,
//       email,
//       password,
//       role,
//     });
//     await user.save();

//     const token = jwt.sign(
//       { userId: user._id, role: user.role },
//       "your_jwt_secret"
//     );
//     res.status(201).json({ token, userId: user._id });
//   } catch (error) {
//     console.error(`Error registering user: ${error}`);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }

// async function loginUser(req, res) {
//   const { email, password, rememberMe } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ error: "Invalid email or password" });
//     }

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(400).json({ error: "Invalid email or password" });
//     }

//     // Set token expiration based on rememberMe flag
//     const tokenExpiration = rememberMe ? "30d" : "1d"; // Long-lived token for "remember me"

//     const token = jwt.sign(
//       { userId: user._id, role: user.role },
//       "your_jwt_secret",
//       {
//         expiresIn: tokenExpiration,
//       }
//     );

//     // Set the token as a cookie
//     res.cookie("token", token, {
//       httpOnly: true,
//       maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
//     }); // 30 days expiration for "remember me"

//     res.status(200).json({ token, userId: user._id, role: user.role });
//   } catch (error) {
//     console.error(`Error logging in user: ${error}`);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }

// const defaultClient = SibApiV3Sdk.ApiClient.instance;
// defaultClient.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

// // Function to send password reset email
// async function sendResetEmail(email, sessionId) {
//   const resetUrl = `http://localhost:8001/api/addbanao/auth/reset-password/${sessionId}`;
//   const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
//   sendSmtpEmail.to = [{ email: email }];
//   sendSmtpEmail.sender = {
//     email: process.env.EMAIL_FROM,
//     name: process.env.EMAIL_FROM_NAME,
//   };
//   sendSmtpEmail.subject = "Password Reset";
//   sendSmtpEmail.htmlContent = `
//     <p>You are receiving this email because you (or someone else) have requested a password reset for your account.</p>
//     <p>Please click on the following link, or paste it into your browser to complete the process:</p>
//     <p><a href="${resetUrl}">${resetUrl}</a></p>
//     <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
//   `;

//   const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
//   await apiInstance.sendTransacEmail(sendSmtpEmail);
// }

// // Function to handle password reset request
// async function forgotPassword(req, res) {
//   const { email } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }
//     const now = new Date();
//     if (
//       (user.passwordChangedAt &&
//         now - user.passwordChangedAt < 5 * 60 * 1000) ||
//       now - user.registeredAt < 5 * 60 * 1000
//     ) {
//       return res.status(400).json({
//         error:
//           "Password reset is not allowed within 5 minutes of registration or password change",
//       });
//     }

//     const resetToken = crypto.randomBytes(20).toString("hex");
//     const hashedResetToken = await bcrypt.hash(resetToken, 10);
//     const resetTokenExpiration = Date.now() + 3600000; // 1 hour expiration

//     user.resetToken = hashedResetToken;
//     user.resetTokenExpiration = resetTokenExpiration;
//     await user.save();

//     await sendResetEmail(user.email, resetToken);

//     res.status(200).json({ message: "Password reset email sent" });
//   } catch (error) {
//     console.error(`Error requesting password reset: ${error}`);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }

// // Function to serve the reset password forms
// async function resetPasswordForm(req, res) {
//   const { token } = req.params;

//   try {
//     const user = await User.findOne({
//       resetTokenExpiration: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({ error: "Invalid or expired token" });
//     }

//     const isTokenValid = await bcrypt.compare(token, user.resetToken);
//     if (!isTokenValid) {
//       return res.status(400).json({ error: "Invalid or expired token" });
//     }

//     res.send(`
//       <html>
//         <body>
//           <form action="/api/addbanao/auth/reset-password?token=${token}" method="POST">
//             <label for="newPassword">New Password:</label>
//             <input type="password" name="newPassword" required minlength="8"/>
//             <label for="confirmPassword">Confirm Password:</label>
//             <input type="password" name="confirmPassword" required minlength="8"/>
//             <button type="submit">Reset Password</button>
//           </form>
//         </body>
//       </html>
//     `);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }

// // Function to handle password reset
// async function resetPassword(req, res) {
//   const { token } = req.query;
//   const { newPassword, confirmPassword } = req.body;

//   if (newPassword !== confirmPassword) {
//     return res.status(400).json({ error: "Passwords do not match" });
//   }

//   try {
//     const user = await User.findOne({
//       resetTokenExpiration: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({ error: "Invalid or expired token" });
//     }

//     const isTokenValid = await bcrypt.compare(token, user.resetToken);
//     if (!isTokenValid) {
//       return res.status(400).json({ error: "Invalid or expired token" });
//     }

//     user.password = newPassword; // Assume you have a pre-save hook to hash the password
//     user.resetToken = undefined;
//     user.resetTokenExpiration = undefined;
//     user.passwordChangedAt = new Date();
//     await user.save();

//     res.status(200).json({ message: "Password has been reset" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }

// module.exports = {
//   forgotPassword,
//   resetPasswordForm,
//   resetPassword,
//   registerUser,
//   loginUser,
// };


// -------------------------------------




// const { Post } = require("../model/post.model");
// const { Category } = require("../model/catagory.model");
// const { cloudinary } = require("../config/cloudnairy.config");
// const fs = require("fs");
// const path = require("path");
// const ffmpeg = require("fluent-ffmpeg");
// const axios = require("axios");
// const ffmpegStatic = require("ffmpeg-static");

// ffmpeg.setFfmpegPath(ffmpegStatic);

// const uploadFileToCloudinary = async (file, username, resourceType) => {
//   return new Promise((resolve, reject) => {
//     cloudinary.uploader.upload(
//       file.path,
//       {
//         resource_type: resourceType,
//         folder: `${username}/${resourceType}`,
//       },
//       (error, result) => {
//         if (error) {
//           reject(error);
//         } else {
//           resolve(result);
//         }
//       }
//     );
//   });
// };

// const uploadChunkToCloudinary = async (chunkBuffer, username, chunkIndex) => {
//   return new Promise((resolve, reject) => {
//     const uploadStream = cloudinary.uploader.upload_stream(
//       {
//         resource_type: "raw",
//         folder: `${username}/auto`,
//         public_id: `chunk_${chunkIndex}`,
//       },
//       (error, result) => {
//         if (error) {
//           console.error(`Error uploading chunk ${chunkIndex}:`, error);
//           reject(error);
//         } else {
//           console.log(`Chunk ${chunkIndex} uploaded successfully.`);
//           resolve(result.secure_url);
//         }
//       }
//     );

//     uploadStream.end(chunkBuffer);
//   });
// };

// const downloadChunkFromCloudinary = async (url) => {
//   try {
//     const response = await axios.get(url, { responseType: "arraybuffer" });
//     return Buffer.from(response.data);
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// };

// const concatenateChunks = async (chunks) => {
//   const buffers = [];

//   for (const chunkUrl of chunks) {
//     const chunkBuffer = await downloadChunkFromCloudinary(chunkUrl);
//     buffers.push(chunkBuffer);
//   }

//   const concatenatedBuffer = Buffer.concat(buffers);
//   const outputRawPath = path.join(__dirname, "output.raw");
//   fs.writeFileSync(outputRawPath, concatenatedBuffer);
//   return outputRawPath;
// };

// const convertRawToVideo = (inputRawVideo, outputVideo, callback) => {
//   const width = 1920; // Adjust as per your input video resolution
//   const height = 1080; // Adjust as per your input video resolution
//   const frameRate = 30; // Adjust as per your input video frame rate

//   ffmpeg(inputRawVideo)
//     .inputOptions([
//       `-f rawvideo`,
//       `-pix_fmt yuv420p`, // Specify pixel format
//       `-s ${width}x${height}`, // Specify resolution
//       `-r ${frameRate}` // Specify frame rate
//     ])
//     .videoCodec("libx264")
//     .size("1920x1080")
//     .fps(30)
//     .outputOptions("-pix_fmt yuv420p") // pixel format
//     .on("end", () => {
//       console.log('Video conversion completed.');
//       callback(null);
//     })
//     .on("error", (err) => {
//       console.log("Error while converting raw video...");
//       console.log(err);
//       callback(err);
//     })
//     .save(outputVideo);
// };

// exports.createPostWithVideo = async (req, res) => {
//   try {
//     const { categoryIds } = req.body;
//     const file = req.file;

//     if (!categoryIds || categoryIds.length === 0) {
//       return res
//         .status(400)
//         .json({ error: "At least one category is required" });
//     }

//     if (!file) {
//       return res.status(400).json({ error: "Video file is required" });
//     }

//     const categories = await Category.find({ _id: { $in: categoryIds } });

//     const videoPath = file.path;
//     const chunkSize = 1 * 1024 * 1024; // 1MB chunks
//     const chunks = [];
//     const cloudinaryIds = [];

//     const fileStream = fs.createReadStream(videoPath, {
//       highWaterMark: chunkSize,
//     });

//     let chunkIndex = 0;

//     for await (const chunk of fileStream) {
//       console.log(`Processing chunk ${chunkIndex}...`);
//       try {
//         const chunkBuffer = Buffer.from(chunk);
//         const chunkUrl = await uploadChunkToCloudinary(
//           chunkBuffer,
//           req.user.username,
//           chunkIndex
//         );
//         console.log(`Chunk ${chunkIndex} URL: ${chunkUrl}`);
//         chunks.push(chunkUrl);
//         cloudinaryIds.push(`chunk_${chunkIndex}`);
//       } catch (error) {
//         console.error(`Error uploading chunk ${chunkIndex}:`, error);
//         return res
//           .status(500)
//           .json({ error: `Error uploading chunk ${chunkIndex}` });
//       }
//       chunkIndex++;
//     }

//     const concatenatedPath = await concatenateChunks(chunks);
//     console.log("concatenatedPath ", concatenatedPath);

//     const outputVideoPath = path.join(__dirname, "output.mp4");
//     convertRawToVideo(concatenatedPath, outputVideoPath, async (err) => {
//       if (err) {
//         console.log(err);
//         return res.status(500).json({ error: "Error converting raw video" });
//       }

//       const finalVideo = await uploadFileToCloudinary(
//         { path: outputVideoPath },
//         req.user.username,
//         "video"
//       );

//       const post = new Post({
//         userId: req.user._id,
//         username: req.user.username,
//         categories: categories.map((category) => category._id),
//         url: [finalVideo.secure_url],
//         cloudinary_id: cloudinaryIds,
//       });

//       await post.save();

//       res.status(201).json(post);
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// exports.createPostWithImage = async (req, res) => {
//   try {
//     const { categoryIds } = req.body;
//     const file = req.file;

//     if (!categoryIds || categoryIds.length === 0) {
//       return res
//         .status(400)
//         .json({ error: "At least one category is required" });
//     }

//     const categories = await Category.find({ _id: { $in: categoryIds } });

//     if (!file) {
//       return res.status(400).json({ error: "Photo file is required" });
//     }

//     if (!req.user || !req.user.username) {
//       return res.status(400).json({ error: "User information not available" });
//     }

//     const result = await uploadFileToCloudinary(
//       file,
//       req.user.username,
//       "image"
//     );

//     const post = new Post({
//       userId: req.user._id,
//       username: req.user.username,
//       categories: categories.map((category) => category._id),
//       url: [result.secure_url],
//       cloudinary_id: [result.public_id],
//     });

//     await post.save();

//     res.status(201).json(post);
//   } catch (error) {
//     console.error("Error creating post with image:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// exports.getPost = async (req, res) => {
//   try {
//     const post = await Post.findById(req.params.id).populate("categories");
//     if (!post) {
//       return res.status(404).json({ error: "Post not found" });
//     }
//     res.status(200).json(post);
//   } catch (error) {
//     console.error("Error fetching post:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// exports.getAllPosts = async (req, res) => {
//   try {
//     const posts = await Post.find().populate("categories");
//     res.status(200).json(posts);
//   } catch (error) {
//     console.error("Error getting posts:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };


const convertRawToVideo = (inputRawVideo, outputVideo, callback) => {
  ffmpeg(inputRawVideo)
    .inputFormat('rawvideo')
    .videoCodec('libx264')
    .size('1920x1080')
    .fps(30)
    .outputOptions('-pix_fmt yuv420p') // Set pixel format for broad compatibility
    .on('end', () => {
      console.log('Video conversion completed successfully');
      callback(null);
    })
    .on('error', (err) => {
      console.error('Error during video conversion:', err);
      callback(err);
    })
    .save(outputVideo);
};


const createPostWithVideo = async (req, res) => {
  try {
    const { categoryIds } = req.body;
    const file = req.file;

    if (!categoryIds || categoryIds.length === 0) {
      return res.status(400).json({ error: 'At least one category is required' });
    }

    if (!file) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    const categories = await Category.find({ _id: { $in: categoryIds } });

    const videoPath = file.path;
    const chunkSize = 1 * 1024 * 1024;
    const chunks = [];
    const cloudinaryIds = [];

    const fileStream = fs.createReadStream(videoPath, {
      highWaterMark: chunkSize,
    });

    let chunkIndex = 0;

    for await (const chunk of fileStream) {
      console.log(`Processing chunk ${chunkIndex}...`);
      try {
        const chunkBuffer = Buffer.from(chunk);
        const chunkUrl = await uploadChunkToCloudinary(
          chunkBuffer,
          req.user.username,
          chunkIndex
        );
        console.log(`Chunk ${chunkIndex} URL: ${chunkUrl}`);
        chunks.push(chunkUrl);
        cloudinaryIds.push(`chunk_${chunkIndex}`);
      } catch (error) {
        console.error(`Error uploading chunk ${chunkIndex}:`, error);
        return res.status(500).json({ error: `Error uploading chunk ${chunkIndex}` });
      }
      chunkIndex++;
    }

    const concatenatedPath = await concatenateChunks(chunks);
    console.log('Concatenated Path:', concatenatedPath);

    const outputVideoPath = path.join(__dirname, 'output.mp4');
    convertRawToVideo(concatenatedPath, outputVideoPath, async (err) => {
      if (err) {
        console.log('Error converting raw video:', err);
        return res.status(500).json({ error: 'Error converting raw video' });
      }

      const finalVideo = await uploadFileToCloudinary(
        { path: outputVideoPath },
        req.user.username,
        'video'
      );

      const post = new Post({
        userId: req.user._id,
        username: req.user.username,
        categories: categories.map((category) => category._id),
        url: [finalVideo.secure_url],
        cloudinary_id: cloudinaryIds,
      });

      await post.save();

      res.status(201).json(post);
    });
  } catch (error) {
    console.error('Error creating post with video:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
