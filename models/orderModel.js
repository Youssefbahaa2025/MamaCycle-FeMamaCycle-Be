// models/orderModel.js
const db = require('../db');
exports.createOrder = async (userId, totalPrice, paymentMethod, address, phone) => {
    const [result] = await db.execute(
      'INSERT INTO orders (user_id, total_price, payment_method, address, phone) VALUES (?, ?, ?, ?, ?)',
      [userId, totalPrice, paymentMethod, address, phone]
    );
    return result.insertId;
  };

exports.addOrderItem = async (orderId, productId, quantity, price) => {
  return db.execute(
    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
    [orderId, productId, quantity, price]
  );
};

exports.getCartItems = async (userId) => {
  const [rows] = await db.query(
    `SELECT c.product_id, c.quantity, p.price 
     FROM cart_items c 
     JOIN products p ON c.product_id = p.id 
     WHERE c.user_id = ?`,
    [userId]
  );
  return rows;
};

exports.clearCart = async (userId) => {
  return db.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);
};
