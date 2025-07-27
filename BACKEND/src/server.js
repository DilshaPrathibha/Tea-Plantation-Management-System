const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectdb = require("../config/db");
const notesroutes = require("./routes/notesroutes");
const ratelimit = require("./middleware/ratelimiter");

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Connect to MongoDB
connectdb();

// Middleware
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(ratelimit);

// Routes
app.use("/api/notes", notesroutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server started on PORT ${port}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
});