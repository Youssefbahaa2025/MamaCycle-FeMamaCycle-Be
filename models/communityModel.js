// backend/models/communityModel.js
const db = require('../db');
exports.getPosts = () => {
  return db.promise().query(
    `SELECT
        cp.*,
        u.name         AS author,
        u.image        AS author_image
     FROM community_posts cp
     LEFT JOIN users u
       ON cp.author_id = u.id
     ORDER BY cp.created_at DESC`
  );
};
exports.createPost = ({ title, content, snippet, image, author_id }) => {
  // Ensure values are not undefined for MySQL (undefined is not allowed, null is)
  const safeValues = [
    title || null,
    content || null,
    snippet || null,
    image || null,
    author_id || null
  ];
  
  return db.promise().execute(
    'INSERT INTO community_posts (title, content, snippet, image, author_id) VALUES (?, ?, ?, ?, ?)',
    safeValues
  );
};

exports.updatePost = ({ id, title, content, snippet, image }) => {
  // Ensure values are not undefined for MySQL
  if (image) {
    return db.promise().execute(
      'UPDATE community_posts SET title = ?, content = ?, snippet = ?, image = ? WHERE id = ?',
      [title || null, content || null, snippet || null, image || null, id || null]
    );
  } else {
    return db.promise().execute(
      'UPDATE community_posts SET title = ?, content = ?, snippet = ? WHERE id = ?',
      [title || null, content || null, snippet || null, id || null]
    );
  }
};

exports.deletePost = (id) => {
  return db.promise().execute(
    'DELETE FROM comments WHERE post_id = ?',
    [id]
  ).then(() => {
    return db.promise().execute(
      'DELETE FROM community_posts WHERE id = ?',
      [id]
    );
  });
};

exports.getPostById = (id) => {
  return db.promise().query(
    'SELECT * FROM community_posts WHERE id = ?',
    [id]
  );
};