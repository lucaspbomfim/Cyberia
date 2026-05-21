const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/songs', (req, res) => {
  const { user_id } = req.query;
  if (user_id) {
    const rows = db
      .prepare('SELECT id, title, artist, user_id, created_at FROM songs WHERE user_id = ? ORDER BY id')
      .all(user_id);
    return res.json(rows);
  }
  const rows = db
    .prepare('SELECT id, title, artist, user_id, created_at FROM songs ORDER BY id')
    .all();
  res.json(rows);
});

router.get('/songs/:id', (req, res) => {
  const row = db
    .prepare('SELECT id, title, artist, file_path, user_id, created_at FROM songs WHERE id = ?')
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: 'song not found' });
  res.json(row);
});

module.exports = router;
