const db = require('../db');

exports.getCart = (userId) => {
  return db.query(
    `SELECT c.id, p.name, p.price, c.quantity, 
     COALESCE(pi.image_path, p.image) as image,
     p.description
     FROM cart_items c 
     JOIN products p ON c.product_id = p.id 
     LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
     WHERE c.user_id = ?`,
    [userId]
  );
};

exports.addToCart = (userId, productId, quantity) => {
  return db.execute(
    'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?',
    [userId, productId, quantity, quantity]
  );
};

exports.removeFromCart = (cartItemId) => {
  return db.execute('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
};
exports.updateQuantity = (id, quantity) => {
  return db.execute('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, id]);
};
