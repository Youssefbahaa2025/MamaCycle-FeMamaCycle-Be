// backend/routes/products.js
const express            = require('express');
const router             = express.Router();
const path               = require('path');
const productsController = require('../controllers/productController');
const { upload }         = require('../config/cloudinary');

// Routes
router.get('/',                  productsController.getAll);
router.get('/pending',           productsController.getPending);
router.get('/:id',               productsController.getById);

// Updated to handle multiple images (up to 5) with Cloudinary storage
router.post('/',  upload.array('images', 5), productsController.create);

// New routes for product images
router.get('/:id/images',        productsController.getProductImages);
router.post('/:id/images',       upload.array('images', 5), productsController.addProductImages);
router.put('/:id/images/:imageId/primary', productsController.setPrimaryImage);
router.delete('/:id/images/:imageId', productsController.deleteProductImage);

router.put('/:id/approve',       productsController.approveProduct);
router.put('/:id/reject',        productsController.rejectProduct);
router.delete('/:id',            productsController.deleteProduct);

module.exports = router;
