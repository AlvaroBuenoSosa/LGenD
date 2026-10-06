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

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
