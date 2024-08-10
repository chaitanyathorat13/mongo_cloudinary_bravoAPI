const { Post } = require("../model/post.model");
const { Category } = require("../model/catagory.model");
const { cloudinary } = require("../config/cloudnairy.config");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { default: axios } = require("axios");
const ffmpegStatic = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegStatic);

const uploadFileToCloudinary = async (file, username, resourceType) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      file.path,
      {
        resource_type: resourceType,
        folder: `${username}/${resourceType}`,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });
};

const uploadChunkToCloudinary = async (chunkBuffer, username, chunkIndex) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: `${username}/auto`,
        public_id: `chunk_${chunkIndex}`,
      },
      
      (error, result) => {
        if (error) {
          console.error(`Error uploading chunk ${chunkIndex}:`, error);
          reject(error);
        } else {
          console.log(`Chunk ${chunkIndex} uploaded successfully.`);
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(chunkBuffer);
  });
};

// exports.createPostWithVideo = async (req, res) => {
//   try {
//     const { categoryIds } = req.body;
//     const file = req.file;

//     if (!categoryIds || categoryIds.length === 0) {
//       return res.status(400).json({ error: "At least one category is required" });
//     }

//     if (!file) {
//       return res.status(400).json({ error: "Video file is required" });
//     }

//     const categories = await Category.find({ _id: { $in: categoryIds } });

//     const videoPath = file.path;
//     const chunkSize = 1 * 1024 * 1024;   //CHUNK_SIZE
//     const chunks = [];
//     const cloudinaryIds = [];

//     const fileStream = fs.createReadStream(videoPath, {
//       highWaterMark: chunkSize,
//     });

//     let chunkIndex = 0;

//     for await (const chunk of fileStream) {
//       console.log(`Processing chunk ${chunkIndex}...`);
//       try {
//         const chunkBuffer = Buffer.from(chunk);    //buffer
//         const chunkUrl = await uploadChunkToCloudinary(
//           chunkBuffer,
//           req.user.username,
//           chunkIndex
//         );                                        //filepath
//         console.log(`Chunk ${chunkIndex} URL: ${chunkUrl}`);
//         chunks.push(chunkUrl);
//         cloudinaryIds.push(`chunk_${chunkIndex}`);
//       } catch (error) {
//         console.error(`Error uploading chunk ${chunkIndex}:`, error);
//         return res.status(500).json({ error: `Error uploading chunk ${chunkIndex}` });
//       }
//       chunkIndex++;
//     }

//     const videoUploadResult = await uploadFileToCloudinary(file, req.user.username, "video");

//     const post = new Post({
//       userId: req.user._id,
//       username: req.user.username,
//       categories: categories.map((category) => category._id),
//       url: [videoUploadResult.secure_url],
//       cloudinary_id: cloudinaryIds,
//     });

//     await post.save();

//     res.status(201).json(post);
//   } catch (error) {
//     console.error("Error creating post with video:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

const downloadChunkFromCloudinary = async (url) => {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const concatenateChunks = async (chunks) => {
  const buffers = [];

  for (const chunkUrl of chunks) {
    const chunkBuffer = await downloadChunkFromCloudinary(chunkUrl);
    buffers.push(chunkBuffer);
  }

  const concatenatedBuffer = Buffer.concat(buffers);
  const outputRawPath = path.join(__dirname, "output.raw");
  fs.writeFileSync(outputRawPath, concatenatedBuffer);
  return outputRawPath;
};

const convertRawToVideo = (inputRawVideo, outputVideo, callback) => {
  const width = 1920; 
  const height = 1080;
  const frameRate = 30; 

  ffmpeg(inputRawVideo)
    .inputOptions([
      `-f rawvideo`,
      `-pix_fmt yuv420p`, 
      `-s ${width}x${height}`,
      `-r ${frameRate}` 
    ])
    .videoCodec("libx264")
    .size("1920x1080")
    .fps(30)
    .outputOptions("-pix_fmt yuv420p") // pixel format
    .on("end", () => {
      console.log('Video conversion completed.');
      callback(null);
    })
    .on("error", (err) => {
      console.log("Error while converting raw video...");
      console.log(err);
      callback(err);
    })
    .save(outputVideo);
};



exports.createPostWithVideo = async (req, res) => {
  try {
    const { categoryIds } = req.body;
    const file = req.file;

    if (!categoryIds || categoryIds.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one category is required" });
    }

    if (!file) {
      return res.status(400).json({ error: "Video file is required" });
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
        return res
          .status(500)
          .json({ error: `Error uploading chunk ${chunkIndex}` });
      }
      chunkIndex++;
    }

    const concatenatedPath = await concatenateChunks(chunks);
    console.log("concatenatedPath ", concatenatedPath);

    const outputVideoPath = path.join(__dirname, "output.mp4");
    convertRawToVideo(concatenatedPath, outputVideoPath, async (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: "Error converting raw video" });
      }

      const finalVideo = await uploadFileToCloudinary(
        { path: outputVideoPath },
        req.user.username,
        "video"
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
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};





exports.createPostWithImage = async (req, res) => {
  try {
    const { categoryIds } = req.body;
    const file = req.file;

    if (!categoryIds || categoryIds.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one category is required" });
    }

    const categories = await Category.find({ _id: { $in: categoryIds } });

    if (!file) {
      return res.status(400).json({ error: "Photo file is required" });
    }

    if (!req.user || !req.user.username) {
      return res.status(400).json({ error: "User information not available" });
    }

    const result = await uploadFileToCloudinary(
      file,
      req.user.username,
      "image"
    );

    const post = new Post({
      userId: req.user._id,
      username: req.user.username,
      categories: categories.map((category) => category._id),
      url: [result.secure_url],
      cloudinary_id: [result.public_id],
    });

    await post.save();

    res.status(201).json(post);
  } catch (error) {
    console.error("Error creating post with image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("categories");
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.status(200).json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("categories");
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error getting posts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
