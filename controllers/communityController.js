const communityModel = require('../models/communityModel');
const { cloudinary } = require('../config/cloudinary');

exports.getAll = async (req, res) => {
  try {
    const [posts] = await communityModel.getPosts();
    
    // Cloudinary URLs are already full, just pass them through
    const postsWithUrls = posts.map(post => ({
      ...post,
      image: post.image || null,
      author_image: post.author_image || null
    }));
    
    res.json(postsWithUrls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load posts' });
  }
};

exports.create = async (req, res) => {
  const image = req.file ? req.file.secure_url : null;
  const { title, content, snippet, author_id } = req.body;
  if (!title || !content || !author_id) {
    return res.status(400).json({ message: 'Title, content, and author_id are required!' });
  }
  try {
    await communityModel.createPost({ 
      title, 
      content, 
      snippet, 
      image, 
      author_id 
    });
    res.json({ message: 'Post submitted' });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
};

exports.update = async (req, res) => {
  const image = req.file ? req.file.secure_url : null;
  const { title, content, snippet } = req.body;
  const { id } = req.params;

  try {
    const [oldRows] = await communityModel.getPostById(id);
    
    // Delete old image from Cloudinary if replacing with a new one
    if (image && oldRows[0].image && oldRows[0].image.includes('cloudinary')) {
      try {
        // Extract public_id from the URL
        const urlParts = oldRows[0].image.split('/');
        const filenameWithExt = urlParts[urlParts.length - 1];
        const filename = filenameWithExt.split('.')[0];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${filename}`;
        
        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted old image from Cloudinary: ${publicId}`);
      } catch (cloudinaryErr) {
        console.error('Error deleting image from Cloudinary:', cloudinaryErr);
        // Continue even if Cloudinary deletion fails
      }
    }
    
    await communityModel.updatePost({ 
      id, 
      title, 
      content, 
      snippet, 
      image: image || oldRows[0].image 
    });
    res.json({ message: 'Post updated' });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Failed to update post', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const postId   = +req.params.id;
    const userId   = req.user.id;
    const userRole = req.user.role;

    const [rows] = await communityModel.getPostById(postId);
    if (!rows.length) {
      return res.status(404).json({ message: 'Post not found' });
    }
    const post = rows[0];

    if (post.author_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Not allowed to delete this post' });
    }

    // Delete image from Cloudinary
    if (post.image && post.image.includes('cloudinary')) {
      try {
        // Extract public_id from the URL
        const urlParts = post.image.split('/');
        const filenameWithExt = urlParts[urlParts.length - 1];
        const filename = filenameWithExt.split('.')[0];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${filename}`;
        
        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted image from Cloudinary: ${publicId}`);
      } catch (cloudinaryErr) {
        console.error('Error deleting image from Cloudinary:', cloudinaryErr);
        // Continue even if Cloudinary deletion fails
      }
    }

    await communityModel.deletePost(postId);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
};
