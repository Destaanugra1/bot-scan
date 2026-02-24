// ============================================
// CRON - Daily summary report (1x/hari jam 08:00 UTC)
// Monitoring real-time 5 menit dilakukan oleh VPS Agent
// ============================================

import { healthCheck, getVpsStatus, formatVpsStatus } from "../lib/vpsClient.js";
import { getSpamStats } from "../lib/sheetReader.js";
import { sendAlertToAdmins } from "../lib/telegramApi.js";

/**
 * Vercel Cron Job handler - Daily Summary
 * Berjalan 1x/hari (Vercel Hobby limit)
 */
export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("[CRON] Daily summary dimulai...");

    // 1. Cek VPS status
    const health = await healthCheck();
    const vpsStatus = health.online ? await getVpsStatus() : null;

    // 2. Cek stats dari Google Sheets
    let statsText = "";
    try {
      const stats = await getSpamStats();
      statsText = stats.success ? stats.text : "Stats tidak tersedia";
    } catch { statsText = "Stats tidak tersedia"; }

    // 3. Kirim daily summary
    const vpsIcon = health.online ? "🟢" : "🔴";
    const botIcon = vpsStatus?.botStatus === "online" ? "🟢" : "🔴";

    const summaryText =
      `📊 <b>DAILY REPORT - ${new Date().toLocaleDateString("id-ID")}</b>\n\n` +
      `${vpsIcon} <b>VPS:</b> ${health.online ? "Online" : "OFFLINE"}\n` +
      `${botIcon} <b>Bot WA:</b> ${vpsStatus?.botStatus === "online" ? "Online" : "OFFLINE"}\n` +
      (vpsStatus ? (
        `\n⏱️ Uptime: ${vpsStatus.uptime || "N/A"}\n` +
        `🧠 CPU: ${vpsStatus.cpu?.usage || 0}%\n` +
        `💾 RAM: ${vpsStatus.ram?.used || "?"}/${vpsStatus.ram?.total || "?"} MB (${vpsStatus.ram?.percentage || "?"}%)\n` +
        `💿 Disk: ${vpsStatus.disk?.used || "?"}/${vpsStatus.disk?.total || "?"} (${vpsStatus.disk?.percentage || "?"}%)\n`
      ) : `\n❌ VPS tidak merespons\n`) +
      `\n---\n${statsText}`;

    await sendAlertToAdmins(summaryText);

    return res.status(200).json({
      status: "daily_summary_sent",
      vps: health.online ? "online" : "offline",
      bot: vpsStatus?.botStatus || "unknown",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Error:", error);
    try {
      await sendAlertToAdmins(
        `🔥 <b>DAILY CRON ERROR</b>\n\n${error.message}\n\n⏰ ${new Date().toLocaleString("id-ID")}`
      );
    } catch (e) {
      console.error("[CRON] Gagal kirim alert:", e);
    }
    return res.status(200).json({ status: "error", error: error.message });
  }
}