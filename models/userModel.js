const db = require('../db');

exports.createUser = (name, email, hashedPassword, role) => {
  return db.promise().execute(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, hashedPassword, role]
  );
};


exports.getUserByEmail = (email) => {
  return db.promise().execute(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
};
