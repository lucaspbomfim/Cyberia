const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('../db');
const { validateUser } = require('../userClient');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
const ALLOWED_EXT = new Set(['.mp3', '.wav', '.ogg', '.flac']);
const MIME = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ALLOWED_EXT.has(ext));
  },
});

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

router.post('/songs', upload.single('file'), async (req, res) => {
  const { title, artist, user_id } = req.body;
  if (!req.file) return res.status(400).json({ error: 'missing or invalid file' });
  if (!title) return res.status(400).json({ error: 'missing field title' });
  if (!user_id) return res.status(400).json({ error: 'missing field user_id' });

  try {
    const valid = await validateUser(user_id);
    if (!valid) return res.status(400).json({ error: 'invalid user_id' });
  } catch (e) {
    if (e.code === 'USER_SERVICE_DOWN') {
      return res.status(503).json({ error: 'user service unavailable' });
    }
    return res.status(500).json({ error: 'internal error' });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const filename = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  try {
    await fs.promises.writeFile(filePath, req.file.buffer);
  } catch (e) {
    return res.status(500).json({ error: 'failed to store file' });
  }

  let row;
  try {
    const result = db
      .prepare('INSERT INTO songs (title, artist, file_path, user_id) VALUES (?, ?, ?, ?)')
      .run(title, artist || 'Unknown', filePath, parseInt(user_id, 10));
    row = db
      .prepare('SELECT id, title, artist, user_id, created_at FROM songs WHERE id = ?')
      .get(result.lastInsertRowid);
  } catch (e) {
    fs.promises.unlink(filePath).catch(() => {});
    return res.status(500).json({ error: 'failed to persist song' });
  }

  res.status(201).json(row);
});

router.get('/songs/:id/stream', (req, res) => {
  const row = db
    .prepare('SELECT file_path FROM songs WHERE id = ?')
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: 'song not found' });
  if (!fs.existsSync(row.file_path)) {
    return res.status(404).json({ error: 'file missing on disk' });
  }
  const ext = path.extname(row.file_path).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  fs.createReadStream(row.file_path).pipe(res);
});

router.delete('/songs/:id', (req, res) => {
  const row = db
    .prepare('SELECT file_path FROM songs WHERE id = ?')
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: 'song not found' });
  db.prepare('DELETE FROM songs WHERE id = ?').run(req.params.id);
  fs.promises.unlink(row.file_path).catch((e) => {
    console.warn(`falha ao remover arquivo ${row.file_path}:`, e.message);
  });
  res.status(204).send();
});

module.exports = router;
