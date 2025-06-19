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
        'https://mama-cycle.vercel.app',       // Vercel frontend URL
        'https://mamacycle-grad-website.vercel.app', // Alternate Vercel URL
        'http://mama-cycle.vercel.app',        // Allow HTTP too
        'http://mamacycle-grad-website.vercel.app',
        // Allow the production backend URL itself for self-referential requests
        'https://mamacycle-marketplace-production.up.railway.app'
      ] 
    : '*',  // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// API request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
