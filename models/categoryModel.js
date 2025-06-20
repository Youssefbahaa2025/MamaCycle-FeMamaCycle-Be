const db = require('../db');

exports.getAllCategories = () =>
  db.query('SELECT * FROM categories');

exports.getCategoryById = (id) =>
  db.query('SELECT * FROM categories WHERE category_id = ?', [id]);

exports.createCategory = (name) =>
  db.execute(
    'INSERT INTO categories (category_name) VALUES (?)',
    [name]
  );

exports.updateCategory = (id, name) =>
  db.execute(
    'UPDATE categories SET category_name = ? WHERE category_id = ?',
    [name, id]
  );

exports.deleteCategory = (id) =>
  db.execute(
    'DELETE FROM categories WHERE category_id = ?',
    [id]
  );
