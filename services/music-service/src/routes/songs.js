const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('../db');
const { validateUser } = require('../userClient');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_EXT = new Set(['.mp3', '.wav', '.ogg', '.flac']);
const MIME = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
};
const MAX_TEXT = 500;

function parseId(raw) {
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isInteger(n) && n >= 1 && n <= Number.MAX_SAFE_INTEGER ? n : null;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ALLOWED_EXT.has(ext));
  },
});

function uploadSingle(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'file too large' });
      }
      return res.status(400).json({ error: `upload error: ${err.code.toLowerCase()}` });
    }
    if (err) return res.status(500).json({ error: 'upload failed' });
    next();
  });
}

router.get('/songs', (req, res) => {
  const { user_id } = req.query;
  if (user_id !== undefined) {
    const uid = parseId(user_id);
    if (uid === null) return res.status(400).json({ error: 'invalid user_id' });
    const rows = db
      .prepare('SELECT id, title, artist, user_id, created_at FROM songs WHERE user_id = ? ORDER BY id')
      .all(uid);
    return res.json(rows);
  }
  const rows = db
    .prepare('SELECT id, title, artist, user_id, created_at FROM songs ORDER BY id')
    .all();
  res.json(rows);
});

router.get('/songs/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: 'song not found' });
  const row = db
    .prepare('SELECT id, title, artist, file_path, user_id, created_at FROM songs WHERE id = ?')
    .get(id);
  if (!row) return res.status(404).json({ error: 'song not found' });
  res.json(row);
});

router.post('/songs', uploadSingle, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'missing or invalid file' });

  const title = (req.body.title || '').trim().slice(0, MAX_TEXT);
  const artistRaw = (req.body.artist || '').trim().slice(0, MAX_TEXT);
  const artist = artistRaw || 'Unknown';
  const uid = parseId(req.body.user_id);

  if (!title) return res.status(400).json({ error: 'missing field title' });
  if (uid === null) return res.status(400).json({ error: 'missing or invalid user_id' });

  try {
    const valid = await validateUser(uid);
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
      .run(title, artist, filePath, uid);
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
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: 'song not found' });
  const row = db
    .prepare('SELECT file_path FROM songs WHERE id = ?')
    .get(id);
  if (!row) return res.status(404).json({ error: 'song not found' });

  const ext = path.extname(row.file_path).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');

  const stream = fs.createReadStream(row.file_path);
  stream.on('error', (err) => {
    if (!res.headersSent) {
      res.removeHeader('Content-Type');
      return res.status(404).json({ error: 'file missing on disk' });
    }
    res.destroy(err);
  });
  stream.pipe(res);
});

router.delete('/songs/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: 'song not found' });
  let filePath;
  try {
    const row = db.prepare('SELECT file_path FROM songs WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ error: 'song not found' });
    filePath = row.file_path;
    db.prepare('DELETE FROM songs WHERE id = ?').run(id);
  } catch (e) {
    return res.status(500).json({ error: 'internal error' });
  }
  fs.promises.unlink(filePath).catch((e) => {
    console.warn(`falha ao remover arquivo ${filePath}:`, e.message);
  });
  res.status(204).send();
});

module.exports = router;
