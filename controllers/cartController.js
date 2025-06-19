const cartModel = require('../models/cartModel');

exports.getCart = async (req, res) => {
  try {
    const [items] = await cartModel.getCart(req.params.userId);
    res.json(items);
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
};

exports.add = async (req, res) => {
  const { userId, productId, quantity } = req.body;
  if (!userId || !productId || !quantity) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await cartModel.addToCart(userId, productId, quantity);
    res.json({ message: 'Item added to cart' });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ message: 'Failed to add item to cart' });
  }
};

exports.remove = async (req, res) => {
  try {
    await cartModel.removeFromCart(req.params.id);
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    console.error('Remove from cart error:', err);
    res.status(500).json({ message: 'Failed to remove item' });
  }
};

exports.updateQuantity = async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || isNaN(quantity)) {
    return res.status(400).json({ message: 'Invalid quantity' });
  }

  try {
    await cartModel.updateQuantity(req.params.id, quantity);
    res.json({ message: 'Cart quantity updated' });
  } catch (err) {
    console.error('Update cart quantity error:', err);
    res.status(500).json({ message: 'Failed to update quantity' });
  }
};
