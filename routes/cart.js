const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const cartController = require('../controllers/cartController');

const router = express.Router();

// 🛡️ All routes require login
router.get('/:userId', verifyToken, cartController.getCart);

router.post('/', verifyToken, cartController.add);

router.delete('/:id', verifyToken, cartController.remove);

router.put('/:id', verifyToken, cartController.updateQuantity);

module.exports = router;
