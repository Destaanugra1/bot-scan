// ============================================
// TELEGRAM BOT API - Wrapper ringan untuk Vercel serverless
// ============================================

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

/**
 * Kirim request ke Telegram Bot API
 */
async function callTelegram(method, body) {
  const res = await fetch(`${TELEGRAM_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    console.error(`[TG-API] ${method} error:`, data.description);
  }
  return data;
}

/**
 * Kirim pesan teks dengan optional inline keyboard
 */
export async function sendMessage(chatId, text, inlineKeyboard = null) {
  const body = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };
  if (inlineKeyboard) {
    body.reply_markup = { inline_keyboard: inlineKeyboard };
  }
  return callTelegram("sendMessage", body);
}

/**
 * Edit pesan yang sudah dikirim (untuk update menu via callback)
 */
export async function editMessage(chatId, messageId, text, inlineKeyboard = null) {
  const body = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
  };
  if (inlineKeyboard) {
    body.reply_markup = { inline_keyboard: inlineKeyboard };
  }
  return callTelegram("editMessageText", body);
}

/**
 * Jawab callback query (hilangkan loading indicator di button)
 */
export async function answerCallback(callbackQueryId, text = "") {
  return callTelegram("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false,
  });
}

/**
 * Kirim alert ke semua admin
 */
export async function sendAlertToAdmins(text) {
  const adminIds = (process.env.TELEGRAM_ADMIN_IDS || "").split(",").filter(Boolean);
  const results = [];
  for (const adminId of adminIds) {
    results.push(await sendMessage(adminId.trim(), text));
  }
  return results;
}

/**
 * Cek apakah user adalah admin yang diizinkan
 */
export function isAdmin(userId) {
  const adminIds = (process.env.TELEGRAM_ADMIN_IDS || "").split(",").map(id => id.trim());
  return adminIds.includes(String(userId));
}

/**
 * Set webhook URL ke Telegram
 */
export async function setWebhook(url) {
  return callTelegram("setWebhook", { url });
}

/**
 * Format timestamp untuk tampilan
 */
export function formatDate(date = new Date()) {
  const pad = (n) => n.toString().padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
