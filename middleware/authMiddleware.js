const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    req.user = { id: decoded.id, role: decoded.role };
    next();
  });
};
