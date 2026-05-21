const express = require('express');
const cors = require('cors');
const songsRouter = require('./routes/songs');

const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use('/', songsRouter);

const PORT = 8002;
app.listen(PORT, () => {
  console.log(`music-service ouvindo em http://localhost:${PORT}`);
});
