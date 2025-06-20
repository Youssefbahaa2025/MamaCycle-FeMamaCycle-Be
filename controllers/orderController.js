// controllers/orderController.js
const orderModel = require('../models/orderModel');
const db = require('../db');

exports.checkout = async (req, res) => {
  // Create a connection from the pool for transaction
  const connection = await db.getConnection();
  
  try {
    // Start transaction
    await connection.beginTransaction();
    
    const { userId, paymentMethod, address, phone } = req.body;

    // Validate required fields
    if (!userId || !paymentMethod || !address || !phone) {
      await connection.release();
      return { error: 'Missing required fields' };
    }

    // Validate userId format
    if (isNaN(parseInt(userId))) {
      await connection.release();
      return { error: 'Invalid user ID' };
    }

    // Get cart items using the transaction connection
    const [cartItems] = await connection.query(
      `SELECT c.product_id, c.quantity, p.price 
       FROM cart_items c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = ?`,
      [userId]
    );

    // Check if cart is empty
    if (!cartItems || cartItems.length === 0) {
      await connection.release();
      return { error: 'Cart is empty' };
    }

    // Calculate total price
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order with transaction connection
    const [orderResult] = await connection.execute(
      'INSERT INTO orders (user_id, total_price, payment_method, address, phone) VALUES (?, ?, ?, ?, ?)',
      [userId, totalPrice, paymentMethod, address, phone]
    );
    
    const orderId = orderResult.insertId;

    // Save items to order_items using transaction connection
    for (const item of cartItems) {
      await connection.execute(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    // Clear the cart using transaction connection
    await connection.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    
    // Commit transaction
    await connection.commit();
    
    // Release connection back to the pool
    await connection.release();
    
    return { orderId };
  } catch (error) {
    // Rollback in case of error
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error('Rollback error:', rollbackError);
    }
    
    // Always release connection
    try {
      await connection.release();
    } catch (releaseError) {
      console.error('Error releasing connection:', releaseError);
    }
    
    console.error('Checkout error:', error);
    throw error;
  }
};

// Get order by ID with items and product details
exports.getOrderById = async (orderId) => {
  try {
    // Validate orderId
    if (!orderId || isNaN(parseInt(orderId))) {
      return { error: 'Invalid order ID' };
    }
    
    // Get the order
    const [orderRows] = await db.query(
      'SELECT o.*, u.name AS user_name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
      [orderId]
    );
    
    if (!orderRows || orderRows.length === 0) {
      return { error: 'Order not found' };
    }
    
    const order = orderRows[0];
    
    // Get the order items with product details
    const [itemRows] = await db.query(
      `SELECT oi.*, p.name AS product_name, 
       (SELECT image_path FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`, 
      [orderId]
    );
    
    // Add image URLs
    const itemsWithImages = itemRows.map(item => ({
      ...item,
      image: item.image ? `http://localhost:3000/${item.image}` : null
    }));
    
    return { ...order, items: itemsWithImages };
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error;
  }
};

// Get all orders for a user
exports.getUserOrders = async (userId) => {
  try {
    // Validate userId
    if (!userId || isNaN(parseInt(userId))) {
      return { error: 'Invalid user ID' };
    }
    
    // Get all orders for the user
    const [orderRows] = await db.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    const orders = [];
    
    // For each order, get the items
    for (const order of orderRows) {
      const [itemRows] = await db.query(
        `SELECT oi.*, p.name AS product_name, 
         (SELECT image_path FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`, 
        [order.id]
      );
      
      // Add image URLs
      const itemsWithImages = itemRows.map(item => ({
        ...item,
        image: item.image ? `http://localhost:3000/${item.image}` : null
      }));
      
      orders.push({ ...order, items: itemsWithImages });
    }
    
    return orders;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
};
