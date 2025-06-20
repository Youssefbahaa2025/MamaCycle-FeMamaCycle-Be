const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyToken = require('../middleware/authMiddleware');

// Checkout endpoint
router.post('/checkout', verifyToken, async (req, res) => {
  try {
    // Validate required fields
    const { userId, paymentMethod, address, phone } = req.body;
    
    if (!userId || !paymentMethod || !address || !phone) {
      return res.status(400).json({ message: 'Missing required fields for checkout' });
    }
    
    // Make sure logged in user can only checkout their own cart
    if (req.user.id != userId) {
      return res.status(403).json({ message: 'Unauthorized: You can only checkout your own cart' });
    }
    
    const result = await orderController.checkout(req, res);
    
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }
    
    res.status(201).json({ message: 'Order placed successfully', orderId: result.orderId });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ 
      message: 'Failed to place order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get a specific order by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // Validate orderId
    if (!orderId || isNaN(parseInt(orderId))) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    
    const orderDetails = await orderController.getOrderById(orderId);
    
    if (orderDetails.error) {
      return res.status(404).json({ message: orderDetails.error });
    }
    
    // Ensure users can only access their own orders (unless admin)
    if (orderDetails.user_id != req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: You can only access your own orders' });
    }
    
    res.status(200).json(orderDetails);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ 
      message: 'Failed to get order details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all orders for a user
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Validate userId
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Ensure users can only access their own orders (unless admin)
    if (userId != req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: You can only access your own orders' });
    }
    
    const orders = await orderController.getUserOrders(userId);
    
    if (orders.error) {
      return res.status(400).json({ message: orders.error });
    }
    
    res.status(200).json(orders);
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ 
      message: 'Failed to get user orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
