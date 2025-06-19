// controllers/orderController.js
const orderModel = require('../models/orderModel');
const db = require('../db');

exports.checkout = async (req, res) => {
  const connection = db.promise();
  
  try {
    await connection.query('START TRANSACTION');
    
    const { userId, paymentMethod, address, phone } = req.body;

    const cartItems = await orderModel.getCartItems(userId);
    if (cartItems.length === 0) {
      await connection.query('ROLLBACK');
      return { error: 'Cart is empty' };
    }

    // Calculate total price
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order with new fields
    const orderId = await orderModel.createOrder(userId, totalPrice, paymentMethod, address, phone);

    // Save items to order_items
    for (const item of cartItems) {
      await orderModel.addOrderItem(orderId, item.product_id, item.quantity, item.price);
    }

    // Clear the cart
    await orderModel.clearCart(userId);
    
    await connection.query('COMMIT');
    
    return { orderId };
  } catch (error) {
    await db.promise().query('ROLLBACK');
    console.error('Checkout error:', error);
    throw error;
  }
};

// Get order by ID with items and product details
exports.getOrderById = async (orderId) => {
  try {
    // Get the order
    const [orderRows] = await db.promise().query(
      'SELECT o.*, u.name AS user_name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
      [orderId]
    );
    
    if (!orderRows.length) return { error: 'Order not found' };
    
    const order = orderRows[0];
    
    // Get the order items with product details
    const [itemRows] = await db.promise().query(
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
    const [orderRows] = await db.promise().query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    const orders = [];
    
    // For each order, get the items
    for (const order of orderRows) {
      const [itemRows] = await db.promise().query(
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
