const categoryModel = require('../models/categoryModel');

exports.index = async (req, res) => {
  try {
    const [rows] = await categoryModel.getAllCategories();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.show = async (req, res) => {
  try {
    const [rows] = await categoryModel.getCategoryById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.store = async (req, res) => {
  const { category_name } = req.body;
  if (!category_name)
    return res.status(400).json({ message: 'category_name required' });
  try {
    const [result] = await categoryModel.createCategory(category_name);
    res.status(201).json({ category_id: result.insertId, category_name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  const { category_name } = req.body;
  try {
    await categoryModel.updateCategory(req.params.id, category_name);
    res.json({ message: 'Category updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.destroy = async (req, res) => {
  try {
    await categoryModel.deleteCategory(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
