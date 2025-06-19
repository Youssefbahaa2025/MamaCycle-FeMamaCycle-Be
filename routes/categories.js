const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const isAdmin     = require('../middleware/isAdmin');
const ctrl        = require('../controllers/categoryController');

const router = express.Router();

// Public
router.get('/',           ctrl.index);
router.get('/:id',        ctrl.show);

// Admin‑only
router.post('/',    verifyToken, isAdmin, ctrl.store);
router.put('/:id',  verifyToken, isAdmin, ctrl.update);
router.delete('/:id', verifyToken, isAdmin, ctrl.destroy);

module.exports = router;
