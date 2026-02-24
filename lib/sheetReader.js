// ============================================
// SHEET READER - Baca data dari Google Sheets (read-only)
// Shared data layer dengan botwa
// ============================================

import { google } from "googleapis";

let sheetsClient = null;

/**
 * Inisialisasi Google Sheets client
 */
function getSheets() {
  if (sheetsClient) return sheetsClient;

  const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
  const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error("Google Sheets credentials belum diatur");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

/**
 * Ambil log chat terakhir dari Google Sheets
 * Sheet3 format: Timestamp | Sender | Phone | Message | Response | Status | Sentiment | Intent | Engagement
 */
export async function getRecentLogs(count = 10, filter = null) {
  try {
    const sheets = getSheets();
    const sheetId = process.env.GOOGLE_LOG_SHEET_ID;
    if (!sheetId) return { success: false, text: "❌ GOOGLE_LOG_SHEET_ID belum diatur" };

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Sheet3!A:I",
    });

    let rows = res.data.values || [];
    if (rows.length <= 1) return { success: true, text: "📝 Belum ada log." };

    // Skip header
    rows = rows.slice(1);

    // Filter by status jika ada
    if (filter) {
      rows = rows.filter((row) => (row[5] || "").toUpperCase() === filter.toUpperCase());
    }

    // Ambil N terakhir
    const recent = rows.slice(-count);

    let text = `📝 <b>LOG CHAT</b>${filter ? ` (${filter})` : ""}\n`;
    text += `Menampilkan ${recent.length} dari ${rows.length} total\n\n`;

    recent.reverse().forEach((row, i) => {
      const time = row[0] || "?";
      const sender = row[1] || "?";
      const message = (row[3] || "").substring(0, 50);
      const status = row[5] || "?";

      const statusIcon =
        status === "SUKSES" ? "✅" :
        status === "SPAM" ? "🚨" :
        status === "ERROR" ? "❌" :
        status === "MENU" ? "📋" :
        status === "WELCOME" ? "👋" : "❔";

      text += `${i + 1}. ${statusIcon} <b>${sender}</b>\n`;
      text += `   📅 ${time}\n`;
      text += `   💬 ${message}${message.length >= 50 ? "..." : ""}\n\n`;
    });

    return { success: true, text };
  } catch (error) {
    return { success: false, text: `❌ Gagal baca log: ${error.message}` };
  }
}

/**
 * Ambil statistik spam dari log
 */
export async function getSpamStats() {
  try {
    const sheets = getSheets();
    const sheetId = process.env.GOOGLE_LOG_SHEET_ID;
    if (!sheetId) return { success: false, text: "❌ GOOGLE_LOG_SHEET_ID belum diatur" };

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Sheet3!A:I",
    });

    let rows = (res.data.values || []).slice(1); // Skip header

    const total = rows.length;
    const spamRows = rows.filter((r) => r[5] === "SPAM");
    const errorRows = rows.filter((r) => r[5] === "ERROR");
    const suksesRows = rows.filter((r) => r[5] === "SUKSES");
    const menuRows = rows.filter((r) => r[5] === "MENU");
    const welcomeRows = rows.filter((r) => r[5] === "WELCOME");

    // Spammer unik
    const spammerMap = {};
    spamRows.forEach((r) => {
      const sender = r[1] || "Unknown";
      spammerMap[sender] = (spammerMap[sender] || 0) + 1;
    });
    const topSpammers = Object.entries(spammerMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Hitung per hari (7 hari terakhir)
    const today = new Date();
    const last7 = rows.filter((r) => {
      try {
        const parts = (r[0] || "").split(" ")[0].split("/");
        const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        return (today - date) / (1000 * 60 * 60 * 24) <= 7;
      } catch { return false; }
    });

    let text =
      `🛡️ <b>STATISTIK SPAM & LOG</b>\n\n` +
      `📊 <b>Total Log:</b> ${total}\n` +
      `✅ Sukses: ${suksesRows.length}\n` +
      `🚨 Spam: ${spamRows.length}\n` +
      `❌ Error: ${errorRows.length}\n` +
      `📋 Menu: ${menuRows.length}\n` +
      `👋 Welcome: ${welcomeRows.length}\n\n` +
      `📅 <b>7 Hari Terakhir:</b> ${last7.length} log\n\n`;

    if (topSpammers.length > 0) {
      text += `🏴‍☠️ <b>Top Spammer:</b>\n`;
      topSpammers.forEach(([name, count], i) => {
        text += `${i + 1}. ${name}: ${count}x\n`;
      });
    }

    return { success: true, text };
  } catch (error) {
    return { success: false, text: `❌ Gagal ambil spam stats: ${error.message}` };
  }
}

/**
 * Ambil daftar user dari Google Sheets
 * Sheet format: UserId | Username | Role | LastActive | ...
 */
export async function getUserList() {
  try {
    const sheets = getSheets();
    const sheetId = process.env.GOOGLE_LOG_SHEET_ID;
    if (!sheetId) return { success: false, text: "❌ GOOGLE_LOG_SHEET_ID belum diatur" };

    // Coba baca dari Sheet2 (user list) yang ditulis oleh botwa
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Sheet2!A:E",
    });

    let rows = (res.data.values || []).slice(1); // Skip header
    if (rows.length === 0) return { success: true, text: "👥 Belum ada user terdaftar." };

    const admins = rows.filter((r) => (r[2] || "").toLowerCase() === "admin");
    const users = rows.filter((r) => (r[2] || "").toLowerCase() !== "admin");

    let text = `👥 <b>DAFTAR USER</b>\n\n`;
    text += `Total: ${rows.length} (${admins.length} admin, ${users.length} user)\n\n`;

    rows.slice(-20).forEach((row, i) => {
      const userId = (row[0] || "?").replace(/@.*/, "");
      const username = row[1] || "Unknown";
      const role = row[2] || "user";
      const lastActive = row[3] || "N/A";
      const icon = role.toLowerCase() === "admin" ? "👑" : "👤";

      text += `${i + 1}. ${icon} <b>${username}</b>\n`;
      text += `   ID: ${userId}\n`;
      text += `   Aktif: ${lastActive}\n\n`;
    });

    if (rows.length > 20) {
      text += `\n<i>Menampilkan 20 user terakhir dari ${rows.length} total</i>`;
    }

    return { success: true, text };
  } catch (error) {
    return { success: false, text: `❌ Gagal ambil user list: ${error.message}` };
  }
}

/**
 * Ambil daftar admin saja
 */
export async function getAdminList() {
  try {
    const sheets = getSheets();
    const sheetId = process.env.GOOGLE_LOG_SHEET_ID;
    if (!sheetId) return { success: false, text: "❌ GOOGLE_LOG_SHEET_ID belum diatur" };

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Sheet2!A:E",
    });

    let rows = (res.data.values || []).slice(1);
    const admins = rows.filter((r) => (r[2] || "").toLowerCase() === "admin");

    if (admins.length === 0) return { success: true, text: "👑 Belum ada admin terdaftar." };

    let text = `👑 <b>DAFTAR ADMIN</b>\n\n`;
    admins.forEach((row, i) => {
      text += `${i + 1}. <b>${row[1] || "Unknown"}</b>\n`;
      text += `   ID: ${(row[0] || "?").replace(/@.*/, "")}\n`;
      text += `   Aktif: ${row[3] || "N/A"}\n\n`;
    });

    return { success: true, text };
  } catch (error) {
    return { success: false, text: `❌ Gagal ambil admin list: ${error.message}` };
  }
}
