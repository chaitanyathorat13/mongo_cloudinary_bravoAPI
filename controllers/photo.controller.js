const Photo = require('../model/photo.model');
const cloudinary = require('../config/cloudnairy.config');

exports.uploadPhoto = async (req, res) => {
  try {
    const photos = [];

    for (const file of req.files) {
      console.log(req.files);
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `multerToCloud/${req.user.username}` 
      });

      const photo = new Photo({
        userId: req.user._id,
        path: file.path,
        cloudinary_id: result.public_id,
        url: result.secure_url
      });
      await photo.save();

      photos.push(photo);
    }

    res.status(201).json({ message: 'Photos uploaded successfully', photos });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error uploading photos', error });
  }
};

exports.getUserPhotos = async (req, res) => {
  try {
    const photos = await Photo.find({ userId: req.user._id });
    res.status(200).json(photos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching photos', error });
  }
};
