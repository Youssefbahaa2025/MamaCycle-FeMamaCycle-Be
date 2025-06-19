const express = require('express');
const path = require('path');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const { profileUpload } = require('../config/cloudinary');

// Count users
router.get('/count', async (req, res) => {
  const [[{ total }]] = await db.promise().query('SELECT COUNT(*) as total FROM users');
  res.json({ total, message: 'User count retrieved' });
});

// Admin orders view
router.get('/admin/orders', verifyToken, isAdmin, async (req, res) => {
  try {
    console.log('Admin orders API called');
    
    // First, check if there are any orders in the database
    const [[orderCount]] = await db.promise().query('SELECT COUNT(*) as count FROM orders');
    console.log('Order count:', orderCount.count);
    
    // If no orders exist, return an empty array
    if (orderCount.count === 0) {
      return res.json({ orders: [], message: 'No orders found' });
    }
    
    // Get all orders with user names
    const [orders] = await db.promise().query(`
      SELECT o.*, u.name AS user_name FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `);
    console.log(`Found ${orders.length} orders`);
    
    // Get all order items with product details
    const [items] = await db.promise().query(`
      SELECT 
        oi.*,
        p.name AS product_name
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id
    `);
    console.log(`Found ${items.length} order items`);
    
    // Get all product images for these products
    const productIds = items.map(item => item.product_id).filter((id, index, self) => self.indexOf(id) === index);
    
    // If there are no products, return empty image array
    let productImages = [];
    if (productIds.length > 0) {
      // Format product IDs for IN clause
      const productIdsString = productIds.join(',');
      const [images] = await db.promise().query(`
        SELECT 
          pi.product_id,
          pi.image_path,
          pi.is_primary
        FROM product_images pi
        WHERE pi.product_id IN (${productIdsString})
      `);
      productImages = images;
      console.log(`Found ${images.length} product images for ${productIds.length} products`);
    }
    
    // Process items to include proper image URLs
    const processedItems = items.map(item => {
      // Find primary image for this product
      const productImgs = productImages.filter(img => img.product_id === item.product_id);
      let imagePath = null;
      
      if (productImgs.length > 0) {
        // First try to find primary image
        const primaryImg = productImgs.find(img => img.is_primary === 1);
        // If primary image exists, use it, otherwise use the first image
        imagePath = primaryImg ? primaryImg.image_path : productImgs[0].image_path;
      }
      
      return {
        ...item,
        // Use the cloudinary URL directly
        image: imagePath || null
      };
    });
    
    // Map orders with their items
    const result = orders.map(order => ({
      ...order,
      items: processedItems.filter(i => i.order_id === order.id)
    }));
    
    console.log('Sending orders response:', { count: result.length });
    res.json({ orders: result, message: 'Orders fetched' });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Admin: Get all users
router.get('/admin/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const [users] = await db.promise().query('SELECT id, name, email, role, created_at FROM users');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Admin: Delete a user
router.delete('/admin/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.promise().query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

// Get profile
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const [[user]] = await db.promise().query('SELECT id, name, email, image FROM users WHERE id = ?', [id]);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  // User's profile image is already a Cloudinary URL or use default
  user.image = user.image || 'https://res.cloudinary.com/dk0szadna/image/upload/v1/mamacycle/profiles/default';
  
  res.json({ user });
});

// Update profile
router.put('/:id', async (req, res) => {
  const { name, email } = req.body;
  const { id } = req.params;
  await db.promise().execute('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]);
  const [[updatedUser]] = await db.promise().query('SELECT id, name, email, image FROM users WHERE id = ?', [id]);
  
  // User's profile image is already a Cloudinary URL or use default
  updatedUser.image = updatedUser.image || 'https://res.cloudinary.com/dk0szadna/image/upload/v1/mamacycle/profiles/default';
  
  res.json({ message: 'Profile updated', user: updatedUser });
});

// Upload image
router.post('/:id/upload', profileUpload.single('image'), async (req, res) => {
  // With Cloudinary, req.file contains secure_url for the uploaded image
  const imagePath = req.file.secure_url;
  await db.promise().execute('UPDATE users SET image = ? WHERE id = ?', [imagePath, req.params.id]);
  res.json({ message: 'Profile picture uploaded', path: imagePath });
});

module.exports = router;
