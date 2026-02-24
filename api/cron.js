// ============================================
// CRON - Health check VPS setiap 5 menit
// Push notification ke Telegram jika VPS mati
// ============================================

import { healthCheck, getVpsStatus, formatVpsStatus } from "../lib/vpsClient.js";
import { sendAlertToAdmins } from "../lib/telegramApi.js";

/**
 * Vercel Cron Job handler
 * Berjalan setiap 5 menit (dikonfigurasi di vercel.json)
 */
export default async function handler(req, res) {
  // Vercel cron menggunakan GET request
  // Juga proteksi dengan CRON_SECRET jika diset
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Jika CRON_SECRET diset, validasi auth header
    // Vercel otomatis mengirim header ini untuk cron jobs
    console.log("[CRON] Unauthorized request, skipping");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("[CRON] Health check dimulai...");

    // 1. Cek kesehatan VPS Agent
    const health = await healthCheck();

    if (!health.online) {
      // VPS tidak merespons - kirim alert!
      console.log("[CRON] VPS OFFLINE! Mengirim alert...");

      const alertText =
        `🚨🚨 <b>ALERT: VPS OFFLINE!</b> 🚨🚨\n\n` +
        `⏰ Waktu: ${new Date().toLocaleString("id-ID")}\n` +
        `❌ Error: ${health.error || "Tidak merespons"}\n\n` +
        `VPS Agent di ${process.env.VPS_AGENT_URL || "unknown"} tidak dapat dihubungi.\n` +
        `Bot WhatsApp kemungkinan juga offline.\n\n` +
        `🔧 Tindakan: Cek VPS segera!`;

      await sendAlertToAdmins(alertText);

      return res.status(200).json({
        status: "alert_sent",
        vps: "offline",
        error: health.error,
        timestamp: new Date().toISOString(),
      });
    }

    // 2. VPS online - cek status bot WA juga
    const vpsStatus = await getVpsStatus();

    if (vpsStatus.success && vpsStatus.botStatus !== "online") {
      // VPS online tapi bot WA offline
      console.log("[CRON] Bot WA OFFLINE! Mengirim alert...");

      const alertText =
        `⚠️ <b>ALERT: Bot WhatsApp Offline!</b>\n\n` +
        `⏰ Waktu: ${new Date().toLocaleString("id-ID")}\n` +
        `🖥️ VPS: 🟢 Online\n` +
        `🤖 Bot WA: 🔴 Offline\n\n` +
        `VPS berjalan normal, tapi Bot WhatsApp tidak merespons.\n` +
        `Gunakan menu Bot Control di /start untuk restart.`;

      await sendAlertToAdmins(alertText);

      return res.status(200).json({
        status: "alert_sent",
        vps: "online",
        bot: "offline",
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Semuanya normal
    console.log("[CRON] Semua OK - VPS online, Bot WA online");

    return res.status(200).json({
      status: "ok",
      vps: "online",
      bot: "online",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Error:", error);

    // Jika terjadi error di cron handler sendiri, tetap kirim alert
    try {
      await sendAlertToAdmins(
        `🔥 <b>CRON ERROR</b>\n\n` +
          `Error di health check cron:\n${error.message}\n\n` +
          `⏰ ${new Date().toLocaleString("id-ID")}`
      );
    } catch (e) {
      console.error("[CRON] Gagal kirim alert:", e);
    }

    return res.status(200).json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
