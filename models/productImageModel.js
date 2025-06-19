const db = require('../db');

// Get all images for a product
exports.getProductImages = (productId) => {
  return db.promise().query(
    'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, created_at ASC',
    [productId]
  );
};

// Get primary image for a product
exports.getPrimaryImage = (productId) => {
  return db.promise().query(
    'SELECT * FROM product_images WHERE product_id = ? AND is_primary = 1 LIMIT 1',
    [productId]
  );
};

// Add a new image to a product
exports.addImage = (productId, imagePath, isPrimary = 0) => {
  // Ensure parameters are never undefined for MySQL
  const safeProductId = productId || null;
  const safeImagePath = imagePath || null;
  const safeIsPrimary = isPrimary !== undefined ? isPrimary : 0;
  
  console.log('Adding product image:', {
    productId: safeProductId,
    imagePath: safeImagePath,
    isPrimary: safeIsPrimary
  });
  
  return db.promise().execute(
    'INSERT INTO product_images (product_id, image_path, is_primary) VALUES (?, ?, ?)',
    [safeProductId, safeImagePath, safeIsPrimary]
  );
};

// Update primary status (set one image as primary, all others as non-primary)
exports.setPrimaryImage = async (imageId, productId) => {
  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();
    
    // Set all images for this product as non-primary
    await conn.execute(
      'UPDATE product_images SET is_primary = 0 WHERE product_id = ?',
      [productId]
    );
    
    // Set specified image as primary
    await conn.execute(
      'UPDATE product_images SET is_primary = 1 WHERE id = ? AND product_id = ?',
      [imageId, productId]
    );
    
    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

// Delete a product image
exports.deleteImage = (imageId, productId) => {
  return db.promise().execute(
    'DELETE FROM product_images WHERE id = ? AND product_id = ?',
    [imageId, productId]
  );
};

// Delete all images for a product
exports.deleteAllProductImages = (productId) => {
  return db.promise().execute(
    'DELETE FROM product_images WHERE product_id = ?',
    [productId]
  );
}; 