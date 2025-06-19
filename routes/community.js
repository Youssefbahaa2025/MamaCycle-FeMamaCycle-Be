const express = require('express');
const path = require('path');
const verifyToken = require('../middleware/authMiddleware');
const communityCtrl = require('../controllers/communityController');
const { upload } = require('../config/cloudinary');

const router = express.Router();

// Routes
router.get('/', communityCtrl.getAll);
router.post('/', verifyToken, upload.single('image'), communityCtrl.create);
router.put('/:id', verifyToken, upload.single('image'), communityCtrl.update);
router.delete('/:id', verifyToken, communityCtrl.delete);

module.exports = router;
