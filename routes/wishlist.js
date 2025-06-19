// backend/routes/wishlist.js
const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const authMiddleware = require('../middleware/authMiddleware');

// All wishlist routes require authentication
router.use(authMiddleware);

// Get user's wishlist
router.get('/', wishlistController.getUserWishlist);

// Add product to wishlist
router.post('/', wishlistController.addToWishlist);

// Remove product from wishlist
router.delete('/:productId', wishlistController.removeFromWishlist);

// Check if product is in wishlist
router.get('/check/:productId', wishlistController.checkWishlist);

// Get wishlist notifications
router.get('/notifications', wishlistController.getNotifications);

// Mark notification as read
router.put('/notifications/:id/read', wishlistController.markNotificationAsRead);

// Get unread notification count
router.get('/notifications/count', wishlistController.getUnreadNotificationCount);

module.exports = router;
