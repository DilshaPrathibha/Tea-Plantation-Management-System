// BACKEND/src/server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config(); // MUST be first, before reading env

const connectdb = require('../config/db');
const ratelimit = require('./middleware/ratelimiter');

const app = express();
const port = process.env.PORT || 5001;



// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
const uploadRoutes = require('./routes/uploadroutes');
app.use('/api/upload', uploadRoutes);

// 1) connect DB
connectdb();

// (optional: log which DB)
const mongoose = require('mongoose');
mongoose.connection.on('connected', () => {
  console.log('[DB] host:', mongoose.connection.host, 'db:', mongoose.connection.name);
});

// 2) middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// 2) middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(ratelimit);

// 3) routes
const authRoutes = require('./routes/authroutes');
const adminRoutes = require('./routes/adminroutes');
const fieldRoutes = require('./routes/fieldroutes');
const incidenceRoutes = require('./routes/incidenceroutes');
const pestDiseaseRoutes = require('./routes/pestdiseaseroutes');
const pluckingRecordRoutes = require('./routes/pluckingRecordRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/incidences', incidenceRoutes);
app.use('/api/pest-diseases', pestDiseaseRoutes);
app.use('/api/plucking-records', pluckingRecordRoutes);

// 4) health
app.get('/health', (req, res) => res.json({ ok: true }));

// 5) 404 + error
app.use((req, res) => res.status(404).send('Not found'));
app.use((err, req, res, next) => {
  console.error('[ERR]', err);
  res.status(500).json({ message: 'Something broke!' });
});

// 6) start
app.listen(port, () => {
  console.log(`🚀 Server started on PORT ${port}`);
});
