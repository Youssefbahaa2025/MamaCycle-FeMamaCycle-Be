// backend/index.js
const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');
const path        = require('path');
require('dotenv').config();

const categoryRoutes  = require('./routes/categories');
const orderRoutes     = require('./routes/order');
const reviewRoutes    = require('./routes/reviews');
const authRoutes      = require('./routes/auth');
const productRoutes   = require('./routes/products');
const cartRoutes      = require('./routes/cart');
const communityRoutes = require('./routes/community');
const usersRoutes     = require('./routes/users');
const commentsRoutes  = require('./routes/comments');
const faqRoutes       = require('./routes/faq');
const wishlistRoutes  = require('./routes/wishlist');

const app = express();

// Configure CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://mama-cycle.vercel.app',      // Vercel frontend URL
      ] 
    : ['http://localhost:4200'],              // Development frontend URL
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Serve static uploads folder
// Any request to /uploads/<filename> will map to backend/uploads/<filename>
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// API routes
app.use('/api/auth',       authRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/cart',       cartRoutes);
app.use('/api/community',  communityRoutes);
app.use('/api/users',      usersRoutes);
app.use('/api/comments',   commentsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/reviews',    reviewRoutes);
app.use('/api/wishlist',   wishlistRoutes);

// FAQ chatbot endpoint
app.use('/api/chat', faqRoutes);
app.get('/api/faq-list', (req, res) => {
  const faq = require('./bot/faq.json');
  res.json(faq.map(item => item.question));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
