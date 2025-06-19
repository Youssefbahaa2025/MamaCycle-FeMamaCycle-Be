// backend/controllers/products.js
const path = require('path');
const productModel = require('../models/productModel');
const productImageModel = require('../models/productImageModel');
const fs = require('fs');
const { cloudinary } = require('../config/cloudinary');

/**
 * Convert a stored relative path "uploads/<filename>"
 * into a full URL: "http(s)://host/uploads/<filename>"
 */
function getImageUrl(req, imagePath) {
  if (!imagePath) return null;
  // Normalize Windows backslashes
  const normalized = imagePath.split(path.sep).join('/');
  return `${req.protocol}://${req.get('host')}/${normalized}`;
}

// GET /api/products
exports.getAll = async (req, res) => {
  try {
    const [rows] = await productModel.getAllProducts();
    const products = [];
    
    // Process each product to get its images
    for (const p of rows) {
      let images = [];
      if (p.images) {
        try {
          // Parse the JSON string of images
          images = JSON.parse(`[${p.images}]`);
        } catch (err) {
          console.error('Error parsing images for product:', p.id, err);
          images = [];
        }
      }
      
      products.push({
        ...p,
        price: p.price.toString(),
        image: images.length > 0 ? images.find(img => img.is_primary)?.url || images[0].url : null,
        images: images,
        has_multiple_images: images.length > 1
      });
    }
    
    res.json(products);
  } catch (err) {
    console.error('Error fetching all products:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/products/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await productModel.getProductById(id);
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });
    
    const p = rows[0];
    
    // Get all images for this product
    const [images] = await productImageModel.getProductImages(id);
    const imageUrls = images.map(img => ({
      id: img.id,
      is_primary: img.is_primary === 1,
      url: img.image_path // Cloudinary URL is stored directly in image_path
    }));
    
    res.json({
      ...p,
      price: p.price.toString(),
      image: imageUrls.length > 0 ? imageUrls.find(img => img.is_primary)?.url || imageUrls[0].url : null,
      images: imageUrls
    });
  } catch (err) {
    console.error(`Error fetching product ${req.params.id}:`, err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/products
exports.create = async (req, res) => {
  try {
    const { name, description, price, seller_id, type, condition, category_id, status } = req.body;
    
    // Validate required fields
    if (!name || !description || !price || !seller_id || !type || !category_id) {
      return res.status(400).json({ message: 'All fields are required!' });
    }
    
    // Check if at least one image is uploaded
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one image is required!' });
    }
    
    // Auto-approve if status is set to 'approved' in the request
    // This allows admin-created products to be immediately approved
    const productStatus = status === 'approved' ? 'approved' : 'pending';
    
    console.log('Creating product with data:', { 
      name, description, price, seller_id, type, condition, category_id, status: productStatus 
    });
    
    // Ensure all parameters have valid values for MySQL (convert undefined to null)
    const safeProductData = {
      name: name || null,
      description: description || null,
      price: price || null,
      seller_id: seller_id || null,
      type: type || null,
      condition: condition || null,
      category_id: category_id || null,
      status: productStatus || 'pending' // Default to pending if null/undefined
    };
    
    // Insert product with the determined status
    const [result] = await productModel.createProduct(safeProductData);
    
    if (!result || !result.insertId) {
      throw new Error('Failed to create product - no insert ID returned');
    }
    
    const insertId = result.insertId;
    console.log('Product created with ID:', insertId);
    
    // Process uploaded images from Cloudinary
    const uploadedFiles = req.files;
    console.log('Processing uploaded files:', uploadedFiles);
    
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      console.log('Processing file:', file);
      
      if (!file) {
        console.error('Invalid file object:', file);
        continue;
      }
      
      // Cloudinary integration - file has different properties
      // secure_url is provided by Cloudinary through multer-storage-cloudinary
      let imagePath;
      if (file.secure_url) {
        // Using Cloudinary 
        imagePath = file.secure_url;
      } else if (file.path) {
        // Local file system
        imagePath = file.path;
      } else {
        console.error('No valid image path found in uploaded file:', file);
        continue;
      }
      
      console.log('Adding image with path:', imagePath, 'isPrimary:', i === 0 ? 1 : 0);
      
      // First image is primary
      await productImageModel.addImage(insertId, imagePath, i === 0 ? 1 : 0);
    }
    
    // Get the updated product with images
    const [newRows] = await productModel.getProductById(insertId);
    const [images] = await productImageModel.getProductImages(insertId);
    
    if (!newRows || newRows.length === 0) {
      return res.status(404).json({ message: 'Product not found after creation' });
    }
    
    const p = newRows[0];
    const imageUrls = images.map(img => ({
      id: img.id,
      is_primary: img.is_primary === 1,
      url: img.image_path // Cloudinary URL is stored directly
    }));
    
    return res.status(201).json({
      ...p,
      price: p.price.toString(),
      image: imageUrls.length > 0 ? imageUrls.find(img => img.is_primary)?.url || imageUrls[0].url : null,
      images: imageUrls
    });
  } catch (err) {
    console.error('Error creating product:', err);
    // Add more detailed error information
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      details: {
        name: err.name,
        stack: err.stack
      }
    });
  }
};

// GET /api/products/pending
exports.getPending = async (req, res) => {
  try {
    const [rows] = await productModel.getPendingProducts();
    
    // Process each product to parse images and format data
    const products = rows.map(p => {
      let images = [];
      if (p.images) {
        try {
          // Parse the GROUP_CONCAT result using the '||' separator
          const imageStrings = p.images.split('||');
          images = imageStrings.map(imgStr => {
            try {
              const imgObj = JSON.parse(imgStr);
              return {
                id: imgObj.id,
                url: imgObj.image_path, // Cloudinary URL is stored directly
                is_primary: imgObj.is_primary === 1
              };
            } catch (jsonErr) {
              console.error('Error parsing individual image JSON for product', p.id, jsonErr);
              return null; // Return null for invalid entries
            }
          }).filter(img => img !== null); // Filter out null entries
        } catch (err) {
          console.error('Error processing images for product', p.id, err);
        }
      }

      return {
        ...p,
        price: p.price.toString(),
        image: images.length > 0 ? 
          images.find(img => img.is_primary)?.url || images[0].url 
          : null,
        images
      };
    });
    
    res.json(products);
  } catch (err) {
    console.error('Error getting pending products:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/products/:id/images
exports.getProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const [images] = await productImageModel.getProductImages(id);
    
    const imageUrls = images.map(img => ({
      id: img.id,
      is_primary: img.is_primary === 1,
      url: img.image_path // Cloudinary URL is stored directly
    }));
    
    res.json(imageUrls);
  } catch (err) {
    console.error(`Error getting images for product ${req.params.id}:`, err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/products/:id/images
exports.addProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if any images were uploaded
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded!' });
    }
    
    // Get existing images count
    const [existingImages] = await productImageModel.getProductImages(id);
    if (existingImages.length + req.files.length > 5) {
      return res.status(400).json({ 
        message: `Maximum 5 images allowed. Product already has ${existingImages.length} images.` 
      });
    }
    
    // Process uploaded images from Cloudinary
    const uploadedFiles = req.files;
    for (const file of uploadedFiles) {
      if (!file) {
        console.error('Invalid file object:', file);
        continue;
      }
      
      // Cloudinary integration - file has different properties
      let imagePath;
      if (file.secure_url) {
        // Using Cloudinary 
        imagePath = file.secure_url;
      } else if (file.path) {
        // Local file system
        imagePath = file.path;
      } else {
        console.error('No valid image path found in uploaded file:', file);
        continue;
      }
      
      // If no images exist, make the first one primary
      const isPrimary = existingImages.length === 0 ? 1 : 0;
      await productImageModel.addImage(id, imagePath, isPrimary);
    }
    
    // Get all images for response
    const [updatedImages] = await productImageModel.getProductImages(id);
    const imageUrls = updatedImages.map(img => ({
      id: img.id,
      is_primary: img.is_primary === 1,
      url: img.image_path // Cloudinary URL is stored directly
    }));
    
    res.status(201).json(imageUrls);
  } catch (err) {
    console.error(`Error adding images to product ${req.params.id}:`, err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      details: {
        name: err.name,
        stack: err.stack
      }
    });
  }
};

// PUT /api/products/:id/images/:imageId/primary
exports.setPrimaryImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    
    await productImageModel.setPrimaryImage(imageId, id);
    
    // Get updated images
    const [updatedImages] = await productImageModel.getProductImages(id);
    const imageUrls = updatedImages.map(img => ({
      id: img.id,
      is_primary: img.is_primary === 1,
      url: img.image_path // Cloudinary URL is stored directly
    }));
    
    res.json(imageUrls);
  } catch (err) {
    console.error(`Error setting primary image for product ${req.params.id}:`, err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/products/:id/images/:imageId
exports.deleteProductImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    
    // First get the image to delete from Cloudinary
    const [images] = await productImageModel.getProductImages(id);
    const targetImage = images.find(img => img.id === parseInt(imageId));
    
    if (!targetImage) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Make sure we have at least one image remaining (or this is not the primary)
    if (images.length <= 1) {
      return res.status(400).json({ message: 'Cannot delete the only image. Products must have at least one image.' });
    }
    
    const isPrimary = targetImage.is_primary === 1;
    
    // Delete the image from the database
    await productImageModel.deleteImage(imageId, id);
    
    // If it was the primary image, set a new primary
    if (isPrimary && images.length > 1) {
      // Find another image to make primary
      const nextImage = images.find(img => img.id !== parseInt(imageId));
      if (nextImage) {
        await productImageModel.setPrimaryImage(nextImage.id, id);
      }
    }
    
    // Delete from Cloudinary if it's a Cloudinary URL
    if (targetImage.image_path && targetImage.image_path.includes('cloudinary')) {
      try {
        // Extract public_id from the URL
        const urlParts = targetImage.image_path.split('/');
        const filenameWithExt = urlParts[urlParts.length - 1];
        const filename = filenameWithExt.split('.')[0];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${filename}`;
        
        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted image from Cloudinary: ${publicId}`);
      } catch (cloudinaryErr) {
        console.error('Error deleting image from Cloudinary:', cloudinaryErr);
        // Continue even if Cloudinary deletion fails
      }
    }
    
    // Get updated images
    const [updatedImages] = await productImageModel.getProductImages(id);
    const imageUrls = updatedImages.map(img => ({
      id: img.id,
      is_primary: img.is_primary === 1,
      url: img.image_path // Cloudinary URL is stored directly
    }));
    
    res.json(imageUrls);
  } catch (err) {
    console.error(`Error deleting image for product ${req.params.id}:`, err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/products/:id/approve
exports.approveProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await productModel.updateProductStatus(id, 'approved');
    
    // Get updated product with images
    const [rows] = await productModel.getProductById(id);
    const [images] = await productImageModel.getProductImages(id);
    
    const p = rows[0];
    const imageUrls = images.map(img => ({
      id: img.id,
      is_primary: img.is_primary === 1,
      url: img.image_path // Cloudinary URL is stored directly
    }));
    
    res.json({
      ...p,
      price: p.price.toString(),
      image: imageUrls.length > 0 ? imageUrls.find(img => img.is_primary)?.url || imageUrls[0].url : null,
      images: imageUrls
    });
  } catch (err) {
    console.error(`Error approving product ${req.params.id}:`, err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/products/:id/reject
exports.rejectProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await productModel.updateProductStatus(id, 'rejected');
    
    // Get updated product with images
    const [rows] = await productModel.getProductById(id);
    const [images] = await productImageModel.getProductImages(id);
    
    const p = rows[0];
    const imageUrls = images.map(img => ({
      id: img.id,
      is_primary: img.is_primary === 1,
      url: img.image_path // Cloudinary URL is stored directly
    }));
    
    res.json({
      ...p,
      price: p.price.toString(),
      image: imageUrls.length > 0 ? imageUrls.find(img => img.is_primary)?.url || imageUrls[0].url : null,
      images: imageUrls
    });
  } catch (err) {
    console.error(`Error rejecting product ${req.params.id}:`, err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the product images before deleting to clean up in Cloudinary
    const [images] = await productImageModel.getProductImages(id);
    
    // Delete product (this will cascade delete the images in the DB due to foreign key)
    await productModel.deleteProductById(id);
    
    // Delete images from Cloudinary
    for (const img of images) {
      if (img.image_path && img.image_path.includes('cloudinary')) {
        try {
          // Extract public_id from the URL
          const urlParts = img.image_path.split('/');
          const filenameWithExt = urlParts[urlParts.length - 1];
          const filename = filenameWithExt.split('.')[0];
          const folder = urlParts[urlParts.length - 2];
          const publicId = `${folder}/${filename}`;
          
          await cloudinary.uploader.destroy(publicId);
          console.log(`Deleted image from Cloudinary: ${publicId}`);
        } catch (cloudinaryErr) {
          console.error('Error deleting image from Cloudinary:', cloudinaryErr);
          // Continue even if Cloudinary deletion fails
        }
      }
    }
    
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(`Error deleting product ${req.params.id}:`, err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
