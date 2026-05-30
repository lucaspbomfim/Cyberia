const express = require('express');
const cors = require('cors');
const songsRouter = require('./routes/songs');

const app = express();

app.use(cors({ origin: '*' }));
app.use('/', songsRouter);

const PORT = process.env.PORT || 8002;
app.listen(PORT, () => {
  console.log(`music-service ouvindo em http://localhost:${PORT}`);
});