// BACKEND/src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Routes (make sure ./routes/adminroutes.js does `export default router`)
import adminRoutes from "./routes/adminroutes.js";
import authRoutes from "./routes/authroutes.js";
import toolsRoutes from "./routes/toolsroutes.js";
import fniRoutes from "./routes/fniroutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/teaplantation";

// --- Middlewares ---
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

// --- Health ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// --- Routes ---
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tools", toolsRoutes);
app.use("/api/fni", fniRoutes);

// --- 404 + Error handler ---
app.use((req, res) => res.status(404).send("Not found"));
app.use((err, req, res, next) => {
  console.error("[ERR]", err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

// --- DB + Start server ---
try {
  await mongoose.connect(MONGO_URI);
  mongoose.connection.on("connected", () => {
    console.log("[DB] host:", mongoose.connection.host, "db:", mongoose.connection.name);
  });
  app.listen(PORT, () => {
    console.log(`🚀 Server started on PORT ${PORT}`);
  });
} catch (err) {
  console.error("Mongo connect error:", err);
  process.exit(1);
}

export default app;
