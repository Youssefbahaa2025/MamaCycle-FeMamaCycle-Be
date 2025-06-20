// backend/models/commentModel.js
const db = require('../db');

exports.getByPostId = (postId) => {
  // join to users so we can show commenter name & avatar
  return db.query(
    `SELECT c.id,
            c.message,
            c.post_id,
            c.user_id,
            c.created_at,
            u.name   AS name,
            u.image  AS image
     FROM comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.post_id = ?
     ORDER BY c.created_at ASC`,
    [postId]
  );
};

exports.getById = (commentId) => {
  return db.query(
    `SELECT id, message, post_id, user_id, created_at 
     FROM comments 
     WHERE id = ?`,
    [commentId]
  );
};

exports.create = ({ post_id, user_id, message }) => {
  return db.execute(
    'INSERT INTO comments (post_id, user_id, message) VALUES (?, ?, ?)',
    [post_id, user_id, message]
  );
};

exports.delete = (commentId) => {
  return db.execute('DELETE FROM comments WHERE id = ?', [commentId]);
};
