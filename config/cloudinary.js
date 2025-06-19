const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const crypto = require('crypto');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to generate a unique filename
const generateUniqueFilename = (req, file) => {
  // Create a unique name using timestamp + random string
  return `${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mamacycle',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1000, crop: 'limit' }],
    format: 'jpg',
    public_id: generateUniqueFilename
  }
});

const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mamacycle/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }],
    format: 'jpg',
    public_id: generateUniqueFilename
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