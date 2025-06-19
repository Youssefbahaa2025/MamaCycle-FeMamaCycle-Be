const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');

// Get reviews by product ID
router.get('/product/:id', async (req, res) => {
  const productId = req.params.id;
  const [rows] = await db.promise().query(
    `SELECT r.*, u.name FROM reviews r JOIN users u ON r.user_id = u.id WHERE product_id = ? ORDER BY r.created_at DESC`,
    [productId]
  );
  res.json(rows);
});

// Add review
router.post('/', verifyToken, async (req, res) => {
  const { userId, productId, rating, comment } = req.body;
  await db.promise().execute(
    'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
    [userId, productId, rating, comment]
  );
  res.json({ message: 'Review submitted successfully' });
});

// Admin can delete
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  await db.promise().execute('DELETE FROM reviews WHERE id = ?', [req.params.id]);
  res.json({ message: 'Review deleted successfully' });
});

module.exports = router;
