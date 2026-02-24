// ============================================
// WEBHOOK HANDLER - Telegram Bot Webhook (Vercel Serverless)
// ============================================

import { sendMessage, editMessage, answerCallback, isAdmin } from "../lib/telegramApi.js";
import {
  MAIN_MENU_TEXT,
  MAIN_MENU_KEYBOARD,
  VPS_STATUS_KEYBOARD,
  SYSTEM_INFO_KEYBOARD,
  LOG_CHAT_KEYBOARD,
  SPAM_STATS_KEYBOARD,
  USERS_KEYBOARD,
  BOT_CONTROL_KEYBOARD,
  BACK_KEYBOARD,
  RESTART_CONFIRM_KEYBOARD,
} from "../lib/menus.js";
import {
  getVpsStatus,
  formatVpsStatus,
  getCpuDetail,
  getRamDetail,
  getDiskDetail,
  getNetworkInfo,
  getBotStatus,
  restartBot,
  getBotUptime,
  getProcessInfo,
} from "../lib/vpsClient.js";
import {
  getRecentLogs,
  getSpamStats,
  getUserList,
  getAdminList,
} from "../lib/sheetReader.js";

/**
 * Vercel serverless handler
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, message: "Botscan Telegram Bot aktif" });
  }

  try {
    const body = req.body;

    // Handle pesan teks biasa
    if (body.message) {
      await handleMessage(body.message);
    }

    // Handle callback dari inline button
    if (body.callback_query) {
      await handleCallback(body.callback_query);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[WEBHOOK] Error:", error);
    return res.status(200).json({ ok: true }); // Selalu 200 agar Telegram tidak retry
  }
}

// ============================================
// MESSAGE HANDLER
// ============================================

async function handleMessage(message) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = (message.text || "").trim();

  // Cek admin
  if (!isAdmin(userId)) {
    await sendMessage(chatId, "⛔ Akses ditolak. Bot ini hanya untuk admin.");
    return;
  }

  // Command handler
  switch (text) {
    case "/start":
      await sendMessage(
        chatId,
        `🖥️ <b>BOTSCAN - VPS Monitor</b>\n\n` +
          `Selamat datang di panel monitoring VPS.\n` +
          `Bot ini terhubung dengan Bot WhatsApp (botwa).\n\n` +
          `Pilih menu di bawah:`,
        MAIN_MENU_KEYBOARD
      );
      break;

    case "/status":
      const status = await getVpsStatus();
      await sendMessage(chatId, formatVpsStatus(status), VPS_STATUS_KEYBOARD);
      break;

    case "/help":
      await sendMessage(
        chatId,
        `📖 <b>BANTUAN</b>\n\n` +
          `<b>Commands:</b>\n` +
          `/start - Menu utama\n` +
          `/status - Quick VPS status\n` +
          `/help - Bantuan\n\n` +
          `Gunakan inline buttons untuk navigasi menu.`,
        MAIN_MENU_KEYBOARD
      );
      break;

    default:
      await sendMessage(chatId, `Gunakan /start untuk membuka menu.`, MAIN_MENU_KEYBOARD);
  }
}

// ============================================
// CALLBACK HANDLER - Inline button actions
// ============================================

async function handleCallback(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;

  // Cek admin
  if (!isAdmin(userId)) {
    await answerCallback(callbackQuery.id, "⛔ Akses ditolak");
    return;
  }

  // Acknowledge callback segera
  await answerCallback(callbackQuery.id);

  try {
    switch (data) {
      // ====== NAVIGASI ======
      case "back_main":
        await editMessage(chatId, messageId, MAIN_MENU_TEXT, MAIN_MENU_KEYBOARD);
        break;

      // ====== VPS STATUS ======
      case "menu_vps_status":
      case "vps_refresh": {
        await editMessage(chatId, messageId, "⏳ Mengambil status VPS...", null);
        const status = await getVpsStatus();
        await editMessage(chatId, messageId, formatVpsStatus(status), VPS_STATUS_KEYBOARD);
        break;
      }

      // ====== SYSTEM INFO ======
      case "menu_system_info": {
        await editMessage(
          chatId,
          messageId,
          `💻 <b>SYSTEM INFO</b>\n\nPilih detail yang ingin dilihat:`,
          SYSTEM_INFO_KEYBOARD
        );
        break;
      }
      case "sys_cpu": {
        await editMessage(chatId, messageId, "⏳ Mengambil data CPU...", null);
        const cpu = await getCpuDetail();
        await editMessage(chatId, messageId, cpu.text, SYSTEM_INFO_KEYBOARD);
        break;
      }
      case "sys_ram": {
        await editMessage(chatId, messageId, "⏳ Mengambil data RAM...", null);
        const ram = await getRamDetail();
        await editMessage(chatId, messageId, ram.text, SYSTEM_INFO_KEYBOARD);
        break;
      }
      case "sys_disk": {
        await editMessage(chatId, messageId, "⏳ Mengambil data Disk...", null);
        const disk = await getDiskDetail();
        await editMessage(chatId, messageId, disk.text, SYSTEM_INFO_KEYBOARD);
        break;
      }
      case "sys_network": {
        await editMessage(chatId, messageId, "⏳ Mengambil data Network...", null);
        const net = await getNetworkInfo();
        await editMessage(chatId, messageId, net.text, SYSTEM_INFO_KEYBOARD);
        break;
      }
      case "sys_refresh": {
        await editMessage(chatId, messageId, "⏳ Mengambil data System...", null);
        const status = await getVpsStatus();
        await editMessage(chatId, messageId, formatVpsStatus(status), SYSTEM_INFO_KEYBOARD);
        break;
      }

      // ====== LOG CHAT ======
      case "menu_log_chat": {
        await editMessage(
          chatId,
          messageId,
          `📝 <b>LOG CHAT</b>\n\nPilih jenis log:`,
          LOG_CHAT_KEYBOARD
        );
        break;
      }
      case "log_recent": {
        await editMessage(chatId, messageId, "⏳ Mengambil log...", null);
        const logs = await getRecentLogs(10);
        await editMessage(chatId, messageId, logs.text, LOG_CHAT_KEYBOARD);
        break;
      }
      case "log_spam": {
        await editMessage(chatId, messageId, "⏳ Mengambil log spam...", null);
        const logs = await getRecentLogs(10, "SPAM");
        await editMessage(chatId, messageId, logs.text, LOG_CHAT_KEYBOARD);
        break;
      }
      case "log_error": {
        await editMessage(chatId, messageId, "⏳ Mengambil log error...", null);
        const logs = await getRecentLogs(10, "ERROR");
        await editMessage(chatId, messageId, logs.text, LOG_CHAT_KEYBOARD);
        break;
      }
      case "log_success": {
        await editMessage(chatId, messageId, "⏳ Mengambil log sukses...", null);
        const logs = await getRecentLogs(10, "SUKSES");
        await editMessage(chatId, messageId, logs.text, LOG_CHAT_KEYBOARD);
        break;
      }

      // ====== SPAM STATS ======
      case "menu_spam_stats":
      case "spam_refresh": {
        await editMessage(chatId, messageId, "⏳ Mengambil statistik...", null);
        const stats = await getSpamStats();
        await editMessage(chatId, messageId, stats.text, SPAM_STATS_KEYBOARD);
        break;
      }
      case "spam_detail": {
        await editMessage(chatId, messageId, "⏳ Mengambil data spam...", null);
        const logs = await getRecentLogs(15, "SPAM");
        await editMessage(chatId, messageId, logs.text, SPAM_STATS_KEYBOARD);
        break;
      }
      case "spam_muted": {
        await editMessage(chatId, messageId, "⏳ Mengambil data muted...", null);
        const status = await getVpsStatus();
        const text = status.success && status.mutedUsers
          ? `🔇 <b>MUTED USERS</b>\n\n${status.mutedUsers.map((u, i) => `${i + 1}. ${u.id} - ${u.remaining} menit`).join("\n") || "Tidak ada user yang dimute"}`
          : `🔇 <b>MUTED USERS</b>\n\nData tidak tersedia (VPS ${status.success ? "online" : "offline"})`;
        await editMessage(chatId, messageId, text, SPAM_STATS_KEYBOARD);
        break;
      }

      // ====== USERS ======
      case "menu_users":
      case "user_refresh": {
        await editMessage(
          chatId,
          messageId,
          `👥 <b>USER MANAGEMENT</b>\n\nPilih opsi:`,
          USERS_KEYBOARD
        );
        break;
      }
      case "user_list": {
        await editMessage(chatId, messageId, "⏳ Mengambil daftar user...", null);
        const users = await getUserList();
        await editMessage(chatId, messageId, users.text, USERS_KEYBOARD);
        break;
      }
      case "user_admins": {
        await editMessage(chatId, messageId, "⏳ Mengambil daftar admin...", null);
        const admins = await getAdminList();
        await editMessage(chatId, messageId, admins.text, USERS_KEYBOARD);
        break;
      }

      // ====== BOT CONTROL ======
      case "menu_bot_control": {
        await editMessage(
          chatId,
          messageId,
          `⚙️ <b>BOT CONTROL</b>\n\nKontrol Bot WhatsApp:`,
          BOT_CONTROL_KEYBOARD
        );
        break;
      }
      case "bot_status": {
        await editMessage(chatId, messageId, "⏳ Mengecek status bot...", null);
        const status = await getBotStatus();
        await editMessage(chatId, messageId, status.text, BOT_CONTROL_KEYBOARD);
        break;
      }
      case "bot_restart": {
        await editMessage(
          chatId,
          messageId,
          `⚠️ <b>KONFIRMASI RESTART</b>\n\nApakah yakin ingin me-restart Bot WhatsApp?\nBot akan offline beberapa saat.`,
          RESTART_CONFIRM_KEYBOARD
        );
        break;
      }
      case "bot_restart_confirm": {
        await editMessage(chatId, messageId, "⏳ Me-restart bot...", null);
        const result = await restartBot();
        await editMessage(chatId, messageId, result.text, BOT_CONTROL_KEYBOARD);
        break;
      }
      case "bot_uptime": {
        await editMessage(chatId, messageId, "⏳ Mengambil data uptime...", null);
        const uptime = await getBotUptime();
        await editMessage(chatId, messageId, uptime.text, BOT_CONTROL_KEYBOARD);
        break;
      }
      case "bot_process": {
        await editMessage(chatId, messageId, "⏳ Mengambil process info...", null);
        const proc = await getProcessInfo();
        await editMessage(chatId, messageId, proc.text, BOT_CONTROL_KEYBOARD);
        break;
      }

      default:
        await editMessage(chatId, messageId, "❓ Menu tidak dikenal.", MAIN_MENU_KEYBOARD);
    }
  } catch (error) {
    console.error(`[CALLBACK] Error handling ${data}:`, error);
    await editMessage(
      chatId,
      messageId,
      `❌ Terjadi error: ${error.message}`,
      MAIN_MENU_KEYBOARD
    );
  }
}
