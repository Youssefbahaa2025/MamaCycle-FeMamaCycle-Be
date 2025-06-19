const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await userModel.getUserByEmail(email);
  if (rows.length === 0) return res.status(401).json({ message: "Invalid credentials" });

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role   
    }
  });
  
};
exports.signup = async (req, res) => {
  const { name, email, password } = req.body;

  const [existing] = await userModel.getUserByEmail(email);
  if (existing.length > 0) {
    return res.status(400).json({ message: "Email already registered" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // 👇 Force role = 'user'
  const role = 'user';

  await userModel.createUser(name, email, hashedPassword, role);

  res.status(201).json({ message: "Signup successful" });
};


