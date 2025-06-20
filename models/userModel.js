const db = require('../db');

exports.createUser = (name, email, hashedPassword, role) => {
  return db.execute(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, hashedPassword, role]
  );
};


exports.getUserByEmail = (email) => {
  return db.execute(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
};
