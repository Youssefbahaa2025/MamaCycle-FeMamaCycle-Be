// backend/controllers/commentController.js
const commentModel = require('../models/commentModel');

exports.getByPostId = async (req, res) => {
  try {
    const postId = +req.params.postId;
    const [rows] = await commentModel.getByPostId(postId);
    return res.json(rows);
  } catch (err) {
    console.error('Error fetching comments:', err);
    return res.status(500).json({ message: 'Failed to load comments' });
  }
};

exports.create = async (req, res) => {
  try {
    const userId = req.user.id;               // from authMiddleware
    const { post_id, message } = req.body;

    if (!post_id || !message?.trim()) {
      return res.status(400).json({ message: 'post_id and message are required' });
    }

    await commentModel.create({ post_id, user_id: userId, message });
    return res.status(201).json({ message: 'Comment added' });
  } catch (err) {
    console.error('Error creating comment:', err);
    return res.status(500).json({ message: 'Failed to add comment' });
  }
};

exports.delete = async (req, res) => {
  try {
    const commentId = +req.params.id;
    
    if (!commentId) {
      return res.status(400).json({ message: 'Comment ID is required' });
    }

    // First, get the comment to check ownership
    const [comment] = await commentModel.getById(commentId);
    
    if (!comment || comment.length === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user is admin or comment owner
    const isAdmin = req.user.role === 'admin';
    const isOwner = comment[0].user_id === req.user.id;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    await commentModel.delete(commentId);
    return res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    return res.status(500).json({ message: 'Failed to delete comment' });
  }
};
