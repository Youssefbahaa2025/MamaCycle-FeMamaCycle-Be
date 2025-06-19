const db = require('../db');
const fs = require('fs');
const path = require('path');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.promise().query('SELECT id, name, email, image FROM users WHERE id = ?', [id]);
    
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
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};


// Update profile (name/email)
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const { id } = req.params;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    await db.promise().query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]);
    
    // Get updated user data
    const [[updatedUser]] = await db.promise().query('SELECT id, name, email, image FROM users WHERE id = ?', [id]);
    
    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// Upload profile image
exports.uploadProfileImage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    // Store relative path instead of absolute
    const imagePath = `uploads/profiles/${req.file.filename}`;

    // Update database
    await db.promise().query('UPDATE users SET image = ? WHERE id = ?', [imagePath, id]);

    // Return the full URL for the frontend
    res.json({ 
      message: 'Image uploaded successfully',
      path: imagePath
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
};
