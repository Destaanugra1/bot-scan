// ============================================
// DEV SERVER - Untuk testing lokal tanpa Vercel
// Jalankan: node dev.js
// ============================================

import "dotenv/config";
import express from "express";
import webhookHandler from "./api/webhook.js";
import cronHandler from "./api/cron.js";

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// Telegram webhook
app.post("/api/webhook", (req, res) => webhookHandler(req, res));
app.get("/api/webhook", (req, res) => webhookHandler(req, res));

// Cron health check (manual trigger)
app.get("/api/cron", (req, res) => cronHandler(req, res));

// Status
app.get("/", (req, res) => {
  res.json({ status: "Botscan dev server running", port: PORT });
});

app.listen(PORT, () => {
  console.log(`\n🤖 Botscan dev server running on http://localhost:${PORT}`);
  console.log(`📡 Webhook: http://localhost:${PORT}/api/webhook`);
  console.log(`⏱️  Cron:    http://localhost:${PORT}/api/cron`);
  console.log(`\nGunakan ngrok untuk expose ke internet:`);
  console.log(`  ngrok http ${PORT}`);
  console.log(`\nLalu set webhook:`);
  console.log(`  set WEBHOOK_URL=https://xxxx.ngrok.io/api/webhook`);
  console.log(`  node scripts/setWebhook.js\n`);
});
