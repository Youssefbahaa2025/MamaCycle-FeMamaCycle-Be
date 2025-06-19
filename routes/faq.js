// routes/faq.js
const express = require('express');
const Fuse    = require('fuse.js');
const faq     = require('../bot/faq.json');

const router = express.Router();
const fuse = new Fuse(faq, {
  keys: ['question'],
  threshold: 0.3,
  includeScore: true
});

router.post('/', (req, res) => {
  const q = (req.body.message || '').toLowerCase().trim();
  if (!q) return res.status(400).json({ error: 'empty_message' });

  const results = fuse.search(q);
  if (!results.length || results[0].score > 0.4) {
    return res.json({
      answer:
        "🤖 Sorry, I don’t understand that yet. Try rephrasing or check our FAQ page."
    });
  }

  res.json({ answer: results[0].item.answer });
});

module.exports = router;
