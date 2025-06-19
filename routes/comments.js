const express = require('express');
const router = express.Router();
const commentCtrl = require('../controllers/commentController');
const verifyToken = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');

// Get comments for a post
router.get('/:postId', commentCtrl.getByPostId);

// Add a comment
router.post('/', verifyToken, async (req, res) => {
  await commentCtrl.create(req, res);
  res.json({ message: 'Comment posted' });
});

// Delete comment - admin OR comment owner
router.delete('/:id', verifyToken, async (req, res) => {
  await commentCtrl.delete(req, res);
});

module.exports = router;
