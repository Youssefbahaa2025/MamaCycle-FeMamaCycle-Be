const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');

// Get reviews by product ID
router.get('/product/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const [rows] = await db.query(
      `SELECT r.*, u.name FROM reviews r JOIN users u ON r.user_id = u.id WHERE product_id = ? ORDER BY r.created_at DESC`,
      [productId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
});

// Add review
router.post('/', verifyToken, async (req, res) => {
  try {
    const { userId, productId, rating, comment } = req.body;
    await db.execute(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
      [userId, productId, rating, comment]
    );
    res.json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Failed to add review', error: error.message });
  }
});

// Admin can delete
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Failed to delete review', error: error.message });
  }
});

module.exports = router;
