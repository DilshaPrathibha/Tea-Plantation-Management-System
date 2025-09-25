// BACKEND/src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config(); // MUST be first, before reading env

const attendanceRoutes = require('./routes/attendanceroutes');
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

// CORS configuration for LAN hosting
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost in any form
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const localNetworkPattern = /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;
    if (localNetworkPattern.test(origin)) {
      return callback(null, true);
    }
    
    // Allow ngrok domains
    if (origin && origin.includes('.ngrok-free.app')) {
      return callback(null, true);
    }
    
    // Allow the configured CLIENT_ORIGIN
    const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    if (origin === allowedOrigin) {
      return callback(null, true);
    }
    
    // Reject other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(ratelimit);

// Serve static files from public directory
app.use(express.static('public'));

// 3) routes


const authRoutes = require('./routes/authroutes');
const adminRoutes = require('./routes/adminroutes'); // ✅ add

const fieldRoutes = require('./routes/fieldroutes'); 
const peopleRoutes = require('./routes/peopleroutes');

const taskRoutes = require('./routes/taskroutes'); 
const workerRoutes = require('./routes/workerroutes');
const toolsRoutes = require('./routes/toolsroutes'); // ✅ add for tools CRUD
const fniRoutes = require('./routes/fniroutes'); // ✅ add for FNI CRUD

const incidenceRoutes = require('./routes/incidenceroutes');


const pestDiseaseRoutes = require('./routes/pestdiseaseroutes');
const pluckingRecordRoutes = require('./routes/pluckingRecordRoutes');
const productionBatchRoutes = require('./routes/productionBatchRoutes');
const transportRoutes = require('./routes/transportRoutes');
const notificationRoutes = require('./routes/notificationroutes');

// Add report routes
const productionBatchRecordRoutes = require('./routes/productionBatchRecordRoutes');
const transportReportRoutes = require('./routes/transportReportRoutes');
const vehicleLocationRoutes = require('./routes/vehicleLocationRoutes');


app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);   
app.use('/api/fields', fieldRoutes);  
app.use('/api/attendance', attendanceRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tools', toolsRoutes);  // ✅ add for tools CRUD           
app.use('/api/fni', fniRoutes);      // ✅ add for FNI CRUD

app.use('/api/worker', workerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/incidences', incidenceRoutes);
app.use('/api/pestdisease', pestDiseaseRoutes);
app.use('/api/plucking-records', pluckingRecordRoutes);
app.use('/api/production-batches', productionBatchRoutes);
app.use('/api/transports', transportRoutes);
app.use('/api/production-batch-records', productionBatchRecordRoutes);
app.use('/api/transport-reports', transportReportRoutes);
app.use('/api', vehicleLocationRoutes);

// 4) health
app.get('/health', (req, res) => res.json({ ok: true }));

// 5) 404 + error
app.use((req, res) => res.status(404).send('Not found'));
app.use((err, req, res, next) => {
  console.error('[ERR]', err);
  res.status(500).json({ message: 'Something broke!' });
});

// 6) start - Listen on all network interfaces for LAN access
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server started on PORT ${port}`);
  
  // Display network information for LAN access
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  
  console.log('\n📡 Network Access URLs:');
  console.log(`   Local: http://localhost:${port}`);
  console.log(`   Local: http://127.0.0.1:${port}`);
  
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    const interfaces = networkInterfaces[interfaceName];
    interfaces.forEach((interface) => {
      if (interface.family === 'IPv4' && !interface.internal) {
        console.log(`   Network: http://${interface.address}:${port}`);
      }
    });
  });
  console.log('');
});

// Add error handling
server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
