const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyToken = require('../middleware/authMiddleware');

// Checkout endpoint
router.post('/checkout', verifyToken, async (req, res) => {
  try {
    // The controller now handles the response directly
    await orderController.checkout(req, res);
  } catch (error) {
    console.error('Checkout route error:', error);
    // This should only execute if the controller didn't handle the response
    res.status(500).json({ message: 'Failed to process checkout request' });
  }
});

// Get a specific order by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderDetails = await orderController.getOrderById(orderId);
    
    if (orderDetails.error) {
      return res.status(404).json({ message: orderDetails.error });
    }
    
    res.status(200).json(orderDetails);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Failed to get order details', error: error.message });
  }
});

// Get all orders for a user
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const orders = await orderController.getUserOrders(userId);
    res.status(200).json(orders);
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ message: 'Failed to get user orders', error: error.message });
  }
});

module.exports = router;
