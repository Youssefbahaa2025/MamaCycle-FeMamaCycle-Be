// backend/controllers/wishlistController.js
const path = require('path');
const wishlistModel = require('../models/wishlistModel');

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

// GET /api/wishlist
exports.getUserWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await wishlistModel.getUserWishlist(userId);
    
    const wishlistItems = [];
    
    // Process each product to get its images
    for (const p of rows) {
      let images = [];
      if (p.images) {
        try {
          // Parse the JSON string of images
          images = JSON.parse(`[${p.images}]`);
          // Convert image paths to URLs
          images = images.map(img => ({
            ...img,
            url: getImageUrl(req, img.url)
          }));
        } catch (err) {
          console.error('Error parsing images for product:', p.id, err);
          images = [];
        }
      }
      
      wishlistItems.push({
        wishlist_id: p.wishlist_id,
        ...p,
        price: p.price.toString(),
        image: images.length > 0 ? images.find(img => img.is_primary)?.url || images[0].url : null,
        images: images,
        has_multiple_images: images.length > 1
      });
    }
    
    res.json(wishlistItems);
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    
    // Check if already in wishlist
    const [existing] = await wishlistModel.isInWishlist(userId, productId);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }
    
    await wishlistModel.addToWishlist(userId, productId);
    
    // Get updated count
    const [countResult] = await wishlistModel.getWishlistCount(userId);
    const count = countResult[0].count;
    
    res.status(201).json({ 
      message: 'Product added to wishlist',
      count
    });
  } catch (err) {
    console.error('Error adding to wishlist:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/wishlist/:productId
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    
    await wishlistModel.removeFromWishlist(userId, productId);
    
    // Get updated count
    const [countResult] = await wishlistModel.getWishlistCount(userId);
    const count = countResult[0].count;
    
    res.json({ 
      message: 'Product removed from wishlist',
      count
    });
  } catch (err) {
    console.error('Error removing from wishlist:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/wishlist/check/:productId
exports.checkWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    
    const [rows] = await wishlistModel.isInWishlist(userId, productId);
    const isInWishlist = rows.length > 0;
    
    res.json({ isInWishlist });
  } catch (err) {
    console.error('Error checking wishlist:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/wishlist/notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [rows] = await wishlistModel.getWishlistNotifications(userId);
    
    // Convert image paths to URLs
    const notifications = rows.map(notification => ({
      ...notification,
      image: notification.image ? getImageUrl(req, notification.image) : null
    }));
    
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/wishlist/notifications/:id/read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    await wishlistModel.markNotificationAsRead(id);
    
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/wishlist/notifications/count
exports.getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [result] = await wishlistModel.getUnreadNotificationCount(userId);
    const count = result[0].count;
    
    res.json({ count });
  } catch (err) {
    console.error('Error getting notification count:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
