const db = require('../db');

exports.getAllCategories = () =>
  db.promise().query('SELECT * FROM categories');

exports.getCategoryById = (id) =>
  db.promise().query('SELECT * FROM categories WHERE category_id = ?', [id]);

exports.createCategory = (name) =>
  db.promise().execute(
    'INSERT INTO categories (category_name) VALUES (?)',
    [name]
  );

exports.updateCategory = (id, name) =>
  db.promise().execute(
    'UPDATE categories SET category_name = ? WHERE category_id = ?',
    [name, id]
  );

exports.deleteCategory = (id) =>
  db.promise().execute(
    'DELETE FROM categories WHERE category_id = ?',
    [id]
  );
