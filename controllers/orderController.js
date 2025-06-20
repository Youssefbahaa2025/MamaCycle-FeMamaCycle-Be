// controllers/orderController.js
const orderModel = require('../models/orderModel');
const db = require('../db');

exports.checkout = async (req, res) => {
  let connection;
  
  try {
    // Use the connection from the pool
    connection = await db.getConnection();
    
    // Start transaction
    await connection.beginTransaction();
    
    const { userId, paymentMethod, address, phone } = req.body;

    // Validate required fields
    if (!userId || !paymentMethod || !address || !phone) {
      throw new Error('Missing required checkout fields');
    }

    // Use the connection for cart items query
    const [cartItemsResult] = await connection.query(
      `SELECT c.*, p.price 
       FROM cart c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = ?`,
      [userId]
    );
    
    if (cartItemsResult.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate total price
    const totalPrice = cartItemsResult.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order
    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, total_price, payment_method, shipping_address, phone) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, totalPrice, paymentMethod, address, phone]
    );
    
    const orderId = orderResult.insertId;

    // Save items to order_items
    for (const item of cartItemsResult) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price) 
         VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    // Clear the cart
    await connection.query('DELETE FROM cart WHERE user_id = ?', [userId]);
    
    // Commit transaction
    await connection.commit();
    
    // Release connection back to the pool
    connection.release();
    
    return res.status(201).json({ 
      message: 'Order placed successfully', 
      orderId: orderId 
    });
    
  } catch (error) {
    console.error('Checkout error:', error);
    
    // If we have a connection, try to roll back
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      } finally {
        connection.release(); // Always release connection back to pool
      }
    }
    
    return res.status(500).json({ message: 'Failed to place order: ' + error.message });
  }
};

// Get order by ID with items and product details
exports.getOrderById = async (orderId) => {
  try {
    // Get the order
    const [orderRows] = await db.query(
      'SELECT o.*, u.name AS user_name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
      [orderId]
    );
    
    if (!orderRows.length) return { error: 'Order not found' };
    
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
