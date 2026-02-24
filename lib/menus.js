// ============================================
// MENUS - Definisi inline keyboard buttons
// ============================================

/**
 * Menu Utama - 6 tombol dalam grid 2 kolom
 */
export const MAIN_MENU_TEXT = `🖥️ <b>BOTSCAN - VPS Monitor</b>\n\nPilih menu di bawah:`;

export const MAIN_MENU_KEYBOARD = [
  [
    { text: "📊 VPS Status", callback_data: "menu_vps_status" },
    { text: "💻 System Info", callback_data: "menu_system_info" },
  ],
  [
    { text: "📝 Log Chat", callback_data: "menu_log_chat" },
    { text: "🛡️ Spam Stats", callback_data: "menu_spam_stats" },
  ],
  [
    { text: "👥 Users", callback_data: "menu_users" },
    { text: "⚙️ Bot Control", callback_data: "menu_bot_control" },
  ],
];

/**
 * Sub-menu VPS Status
 */
export const VPS_STATUS_KEYBOARD = [
  [{ text: "🔄 Refresh", callback_data: "vps_refresh" }],
  [{ text: "⬅️ Kembali", callback_data: "back_main" }],
];

/**
 * Sub-menu System Info
 */
export const SYSTEM_INFO_KEYBOARD = [
  [
    { text: "🧠 CPU Detail", callback_data: "sys_cpu" },
    { text: "💾 RAM Detail", callback_data: "sys_ram" },
  ],
  [
    { text: "💿 Disk Usage", callback_data: "sys_disk" },
    { text: "🌐 Network", callback_data: "sys_network" },
  ],
  [{ text: "🔄 Refresh", callback_data: "sys_refresh" }],
  [{ text: "⬅️ Kembali", callback_data: "back_main" }],
];

/**
 * Sub-menu Log Chat
 */
export const LOG_CHAT_KEYBOARD = [
  [
    { text: "📋 10 Log Terakhir", callback_data: "log_recent" },
    { text: "🚨 Log Spam", callback_data: "log_spam" },
  ],
  [
    { text: "❌ Log Error", callback_data: "log_error" },
    { text: "✅ Log Sukses", callback_data: "log_success" },
  ],
  [{ text: "⬅️ Kembali", callback_data: "back_main" }],
];

/**
 * Sub-menu Spam Stats
 */
export const SPAM_STATS_KEYBOARD = [
  [
    { text: "📊 Stats Detail", callback_data: "spam_detail" },
    { text: "🔇 Muted Users", callback_data: "spam_muted" },
  ],
  [{ text: "🔄 Refresh", callback_data: "spam_refresh" }],
  [{ text: "⬅️ Kembali", callback_data: "back_main" }],
];

/**
 * Sub-menu Users
 */
export const USERS_KEYBOARD = [
  [
    { text: "📋 Daftar User", callback_data: "user_list" },
    { text: "👑 Admin List", callback_data: "user_admins" },
  ],
  [{ text: "🔄 Refresh", callback_data: "user_refresh" }],
  [{ text: "⬅️ Kembali", callback_data: "back_main" }],
];

/**
 * Sub-menu Bot Control
 */
export const BOT_CONTROL_KEYBOARD = [
  [
    { text: "📡 Status Bot WA", callback_data: "bot_status" },
    { text: "🔄 Restart Bot WA", callback_data: "bot_restart" },
  ],
  [
    { text: "📊 Uptime", callback_data: "bot_uptime" },
    { text: "📝 Process Info", callback_data: "bot_process" },
  ],
  [{ text: "⬅️ Kembali", callback_data: "back_main" }],
];

/**
 * Tombol kembali saja
 */
export const BACK_KEYBOARD = [
  [{ text: "⬅️ Kembali", callback_data: "back_main" }],
];

/**
 * Konfirmasi restart
 */
export const RESTART_CONFIRM_KEYBOARD = [
  [
    { text: "✅ Ya, Restart", callback_data: "bot_restart_confirm" },
    { text: "❌ Batal", callback_data: "menu_bot_control" },
  ],
];
