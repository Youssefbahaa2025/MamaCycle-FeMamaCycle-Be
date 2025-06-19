// backend/models/productModel.js
const db = require('../db');

exports.getAllProducts = () => db.promise().query(`
  SELECT 
    p.*,
    c.category_name,
    GROUP_CONCAT(
      JSON_OBJECT(
        'id', pi.id,
        'url', pi.image_path,
        'is_primary', pi.is_primary
      )
    ) as images
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.category_id
  LEFT JOIN product_images pi ON p.id = pi.product_id
  WHERE p.status = 'approved'
  GROUP BY p.id
`);
exports.getProductById = (id) => db.promise().query(`
  SELECT
    p.*,
    c.category_id,
    c.category_name
  FROM products AS p
  LEFT JOIN categories AS c
    ON p.category_id = c.category_id
  WHERE p.id = ?
`, [id]);

exports.createProduct = ({ name, description, price, seller_id, type, condition, category_id, status = 'pending' }) => {
  // Convert price to a number if it's a string
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numericPrice)) {
    throw new Error('Invalid price value');
  }

  return db.promise().execute(
    `INSERT INTO products
      (name, description, price, status, seller_id, type, \`condition\`, category_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, description, numericPrice, status, seller_id, type, condition, category_id]
  );
};
exports.getPendingProducts = () => {
  return db.promise().query(`
    SELECT 
      p.*,
      c.category_name,
      GROUP_CONCAT(
        JSON_OBJECT(
          'id', pi.id,
          'image_path', pi.image_path,
          'is_primary', pi.is_primary
        ) SEPARATOR '||'
      ) as images
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN product_images pi ON p.id = pi.product_id
    WHERE p.status = 'pending'
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);
};

exports.updateProductStatus = (id, status) => {
  return db.promise().query('UPDATE products SET status = ? WHERE id = ?', [status, id]);
};

exports.deleteProductById = (id) => {
  return db.promise().query('DELETE FROM products WHERE id = ?', [id]);
};