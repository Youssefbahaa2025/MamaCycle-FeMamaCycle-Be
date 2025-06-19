const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mamacycle',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1000, crop: 'limit' }]
  }
});

const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mamacycle/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }]
  }
});

// Create multer instances with the Cloudinary storage
const upload = multer({ storage });
const profileUpload = multer({ storage: profileStorage });

module.exports = {
  cloudinary,
  upload,
  profileUpload
}; 