// backend/models/wishlistModel.js
const db = require('../db');

// Get all wishlist items for a user
exports.getUserWishlist = (userId) => {
  return db.query(`
    SELECT 
      w.id as wishlist_id,
      p.*,
      c.category_name,
      GROUP_CONCAT(
        JSON_OBJECT(
          'id', pi.id,
          'url', pi.image_path,
          'is_primary', pi.is_primary
        )
      ) as images
    FROM wishlists w
    JOIN products p ON w.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN product_images pi ON p.id = pi.product_id
    WHERE w.user_id = ? AND p.status = 'approved'
    GROUP BY p.id
  `, [userId]);
};

// Check if a product is in user's wishlist
exports.isInWishlist = (userId, productId) => {
  return db.query(
    'SELECT * FROM wishlists WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
};

// Add product to wishlist
exports.addToWishlist = (userId, productId) => {
  return db.execute(
    'INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)',
    [userId, productId]
  );
};

// Remove product from wishlist
exports.removeFromWishlist = (userId, productId) => {
  return db.execute(
    'DELETE FROM wishlists WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
};

// Get wishlist count for a user
exports.getWishlistCount = (userId) => {
  return db.query(
    'SELECT COUNT(*) as count FROM wishlists WHERE user_id = ?',
    [userId]
  );
};

// Get notifications for wishlist items
exports.getWishlistNotifications = (userId) => {
  return db.query(`
    SELECT 
      wn.id as notification_id,
      wn.type,
      wn.is_read,
      wn.created_at,
      p.id as product_id,
      p.name as product_name,
      p.price,
      (SELECT image_path FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
    FROM wishlist_notifications wn
    JOIN wishlists w ON wn.wishlist_id = w.id
    JOIN products p ON w.product_id = p.id
    WHERE w.user_id = ?
    ORDER BY wn.created_at DESC
  `, [userId]);
};

// Mark notification as read
exports.markNotificationAsRead = (notificationId) => {
  return db.execute(
    'UPDATE wishlist_notifications SET is_read = 1 WHERE id = ?',
    [notificationId]
  );
};

// Create a notification
exports.createNotification = (wishlistId, type) => {
  return db.execute(
    'INSERT INTO wishlist_notifications (wishlist_id, type) VALUES (?, ?)',
    [wishlistId, type]
  );
};

// Get unread notification count
exports.getUnreadNotificationCount = (userId) => {
  return db.query(`
    SELECT COUNT(*) as count 
    FROM wishlist_notifications wn
    JOIN wishlists w ON wn.wishlist_id = w.id
    WHERE w.user_id = ? AND wn.is_read = 0
  `, [userId]);
};
