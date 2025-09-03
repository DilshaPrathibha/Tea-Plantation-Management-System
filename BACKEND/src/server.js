// BACKEND/src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config(); // MUST be first, before reading env

const connectdb = require('../config/db');
const ratelimit = require('./middleware/ratelimiter');

// 1) connect DB
connectdb();

// (optional: log which DB)
const mongoose = require('mongoose');
mongoose.connection.on('connected', () => {
  console.log('[DB] host:', mongoose.connection.host, 'db:', mongoose.connection.name);
});

const app = express();
const port = process.env.PORT || 5001;

// 2) middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(ratelimit);

// 3) routes
const authRoutes = require('./routes/authroutes');
const adminRoutes = require('./routes/adminroutes'); // ✅ add
const fieldRoutes = require('./routes/fieldroutes'); 
const weatherRoutes = require('./routes/weatherRoutes');
const taskAssignmentRoutes = require('./routes/taskAssignmentRoutes');


app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);   
app.use('/api/fields', fieldRoutes);  
app.use('/api/weather', weatherRoutes);
app.use('/api/tasks', taskAssignmentRoutes);

            // ✅ add

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


