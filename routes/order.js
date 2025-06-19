const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyToken = require('../middleware/authMiddleware');

// Checkout endpoint
router.post('/checkout', verifyToken, async (req, res) => {
  try {
    const result = await orderController.checkout(req, res);
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }
    res.status(201).json({ message: 'Order placed successfully', orderId: result.orderId });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: 'Failed to place order' });
  }
});

// Get a specific order by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderDetails = await orderController.getOrderById(orderId);
    res.status(200).json(orderDetails);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Failed to get order details' });
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
    res.status(500).json({ message: 'Failed to get user orders' });
  }
});

module.exports = router;
