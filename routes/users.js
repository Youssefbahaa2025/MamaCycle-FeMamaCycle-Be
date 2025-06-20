const express = require('express');
const path = require('path');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const { profileUpload } = require('../config/cloudinary');

// Count users
router.get('/count', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) as total FROM users');
    res.json({ total: rows[0].total, message: 'User count retrieved' });
  } catch (error) {
    console.error('Error counting users:', error);
    res.status(500).json({ message: 'Failed to retrieve user count', error: error.message });
  }
});

// Admin orders view
router.get('/admin/orders', verifyToken, isAdmin, async (req, res) => {
  try {
    console.log('Admin orders API called');
    
    // First, check if there are any orders in the database
    const [countRows] = await db.query('SELECT COUNT(*) as count FROM orders');
    const orderCount = countRows[0].count;
    console.log('Order count:', orderCount);
    
    // If no orders exist, return an empty array
    if (orderCount === 0) {
      return res.json({ orders: [], message: 'No orders found' });
    }
    
    // Get all orders with user names
    const [orders] = await db.query(`
      SELECT o.*, u.name AS user_name FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `);
    console.log(`Found ${orders.length} orders`);
    
    // Get all order items with product details
    const [items] = await db.query(`
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
      // Format product IDs for IN clause with parameterized query
      const placeholders = productIds.map(() => '?').join(',');
      const [images] = await db.query(`
        SELECT 
          pi.product_id,
          pi.image_path,
          pi.is_primary
        FROM product_images pi
        WHERE pi.product_id IN (${placeholders})
      `, productIds);
      
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
    const [users] = await db.query('SELECT id, name, email, role, created_at FROM users');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Admin: Delete a user
router.delete('/admin/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate user ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Check if trying to delete admin account
    const [admins] = await db.query('SELECT id FROM users WHERE id = ? AND role = "admin"', [id]);
    if (admins.length > 0) {
      return res.status(403).json({ message: 'Cannot delete admin account' });
    }
    
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

// Get profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate id parameter
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const [users] = await db.query('SELECT id, name, email, image FROM users WHERE id = ?', [id]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[0];
    
    // User's profile image is already a Cloudinary URL or use default
    user.image = user.image || 'https://res.cloudinary.com/dk0szadna/image/upload/v1/mamacycle/profiles/default';
    
    res.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user profile', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Update profile
router.put('/:id', async (req, res) => {
  try {
    const { name, email } = req.body;
    const { id } = req.params;
    
    // Validate inputs
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    const [result] = await db.execute('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }
    
    const [users] = await db.query('SELECT id, name, email, image FROM users WHERE id = ?', [id]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found after update' });
    }
    
    const updatedUser = users[0];
    
    // User's profile image is already a Cloudinary URL or use default
    updatedUser.image = updatedUser.image || 'https://res.cloudinary.com/dk0szadna/image/upload/v1/mamacycle/profiles/default';
    
    res.json({ message: 'Profile updated', user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    
    // Handle duplicate email error specifically
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already in use' });
    }
    
    res.status(500).json({ 
      message: 'Failed to update profile', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Upload image
router.post('/:id/upload', profileUpload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate user ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    console.log('User profile image upload:', req.file);
    
    // Get image path from the uploaded file
    let imagePath;
    
    // With Cloudinary, check for secure_url first, then path
    if (req.file.secure_url) {
      imagePath = req.file.secure_url;
    } else if (req.file.path) {
      imagePath = req.file.path;
    } else {
      return res.status(500).json({ 
        message: 'Invalid file format or Cloudinary error', 
        error: 'No secure_url or path found in uploaded file' 
      });
    }
    
    // Check if user exists
    const [users] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Convert undefined to null for MySQL
    const safeImagePath = imagePath || null;
    
    console.log(`Updating profile image for user ${id} with path: ${safeImagePath}`);
    
    const [result] = await db.execute('UPDATE users SET image = ? WHERE id = ?', [safeImagePath, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }
    
    res.json({ 
      message: 'Profile picture uploaded',
      path: safeImagePath 
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ 
      message: 'Failed to upload profile picture', 
      error: error.message,
      details: {
        name: error.name,
        code: error.code
      }
    });
  }
});

module.exports = router;
