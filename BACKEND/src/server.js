import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({ path: "BACKEND/.env" });

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 5001;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
