const db = require('../db');
const fs = require('fs');
const path = require('path');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate input
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const [rows] = await db.query('SELECT id, name, email, image FROM users WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];
    // Ensure image path is always returned
    if (user.image && !user.image.startsWith('uploads/')) {
      user.image = `uploads/profiles/${user.image}`;
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ 
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// Update profile (name/email)
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const { id } = req.params;
    
    // Validate input
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const [result] = await db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }
    
    // Get updated user data
    const [updatedRows] = await db.query('SELECT id, name, email, image FROM users WHERE id = ?', [id]);
    
    if (updatedRows.length === 0) {
      return res.status(404).json({ message: 'User not found after update' });
    }
    
    res.json({ 
      message: 'Profile updated successfully',
      user: updatedRows[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    
    // Handle duplicate email error specifically
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already in use' });
    }
    
    res.status(500).json({ 
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Upload profile image
exports.uploadProfileImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate input
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    // Store relative path instead of absolute
    const imagePath = `uploads/profiles/${req.file.filename}`;

    // Check if user exists before updating
    const [userRows] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update database
    const [result] = await db.query('UPDATE users SET image = ? WHERE id = ?', [imagePath, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }

    // Return the full URL for the frontend
    res.json({ 
      message: 'Image uploaded successfully',
      path: imagePath
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ 
      message: 'Failed to upload image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
