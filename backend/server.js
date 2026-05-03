const express = require('express');
const cors = require('cors');
const { join } = require('path');
const dotenv = require('dotenv');

const loaded = dotenv.config({ path: join(__dirname, '.env') });
if (!loaded.parsed) {
  dotenv.config({ path: join(__dirname, '..', '.env') });
}

const playerRoutes = require('./routes/player.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', playerRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
