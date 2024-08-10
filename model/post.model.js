const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  userId: {
    type: Number,
    ref: "User",
    required: true,
  },
  username: {
    type: String,
    ref: "User",
    required: true,
  },
  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
  ],
  cloudinary_id: [
    {
      type: String,
    },
  ],
  url: [
    {
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Post = mongoose.model("Post", postSchema);

module.exports = { Post };
