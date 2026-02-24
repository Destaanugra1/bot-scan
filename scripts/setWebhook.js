// ============================================
// SET WEBHOOK - Script untuk mendaftarkan webhook URL ke Telegram
// Jalankan: node scripts/setWebhook.js
// ============================================

import "dotenv/config";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN belum diatur di .env");
  process.exit(1);
}

// Ganti dengan URL Vercel kamu
const WEBHOOK_URL = process.env.WEBHOOK_URL || "https://botscan.vercel.app/api/webhook";

async function setWebhook() {
  console.log(`\n🔗 Setting webhook ke: ${WEBHOOK_URL}\n`);

  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        allowed_updates: ["message", "callback_query"],
      }),
    }
  );

  const data = await res.json();

  if (data.ok) {
    console.log("✅ Webhook berhasil diset!");
    console.log(`   URL: ${WEBHOOK_URL}`);
  } else {
    console.error("❌ Gagal set webhook:", data.description);
  }

  // Cek info webhook saat ini
  const infoRes = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
  );
  const info = await infoRes.json();
  console.log("\n📋 Webhook Info:");
  console.log(`   URL: ${info.result?.url || "tidak diset"}`);
  console.log(`   Pending updates: ${info.result?.pending_update_count || 0}`);
  console.log(`   Last error: ${info.result?.last_error_message || "tidak ada"}`);
}

setWebhook().catch(console.error);
