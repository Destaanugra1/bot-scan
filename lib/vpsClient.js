// ============================================
// VPS CLIENT - Komunikasi dengan VPS Agent
// ============================================

const VPS_URL = process.env.VPS_AGENT_URL || "http://localhost:3001";
const VPS_SECRET = process.env.VPS_AGENT_SECRET || "";
const TIMEOUT_MS = 10000;

/**
 * Kirim request ke VPS Agent dengan auth & timeout
 */
async function callAgent(path, method = "GET") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${VPS_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${VPS_SECRET}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === "AbortError") {
      throw new Error("VPS Agent tidak merespons (timeout 10s)");
    }
    throw error;
  }
}

/**
 * Health check - cek apakah VPS agent masih hidup
 */
export async function healthCheck() {
  try {
    const data = await callAgent("/health");
    return { online: true, ...data };
  } catch (error) {
    return { online: false, error: error.message };
  }
}

/**
 * Status VPS - overview CPU, RAM, disk, uptime, status botwa
 */
export async function getVpsStatus() {
  try {
    const data = await callAgent("/status");
    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Format VPS status jadi teks yang rapi
 */
export function formatVpsStatus(data) {
  if (!data.success) {
    return `🔴 <b>VPS OFFLINE</b>\n\n❌ ${data.error}`;
  }

  const cpu = data.cpu || {};
  const ram = data.ram || {};
  const disk = data.disk || {};

  return (
    `🖥️ <b>VPS STATUS</b>\n\n` +
    `🟢 Status: <b>Online</b>\n` +
    `⏱️ Uptime: <b>${data.uptime || "N/A"}</b>\n\n` +
    `🧠 <b>CPU</b>: ${cpu.usage || "N/A"}% (${cpu.cores || "?"} cores)\n` +
    `💾 <b>RAM</b>: ${ram.used || "?"} / ${ram.total || "?"} MB (${ram.percentage || "?"}%)\n` +
    `💿 <b>Disk</b>: ${disk.used || "?"} / ${disk.total || "?"} (${disk.percentage || "?"}%)\n\n` +
    `🤖 <b>Bot WA</b>: ${data.botStatus === "online" ? "🟢 Online" : "🔴 Offline"}\n` +
    `📅 Diperbarui: ${new Date().toLocaleString("id-ID")}`
  );
}

/**
 * Detail CPU
 */
export async function getCpuDetail() {
  try {
    const data = await callAgent("/system/cpu");
    return {
      success: true,
      text:
        `🧠 <b>CPU DETAIL</b>\n\n` +
        `Model: ${data.model || "N/A"}\n` +
        `Cores: ${data.cores || "N/A"}\n` +
        `Usage: ${data.usage || "N/A"}%\n` +
        `Load Avg (1/5/15m): ${(data.loadAvg || []).join(" / ") || "N/A"}\n` +
        `Speed: ${data.speed || "N/A"} MHz`,
    };
  } catch (error) {
    return { success: false, text: `❌ Gagal ambil data CPU: ${error.message}` };
  }
}

/**
 * Detail RAM
 */
export async function getRamDetail() {
  try {
    const data = await callAgent("/system/ram");
    return {
      success: true,
      text:
        `💾 <b>RAM DETAIL</b>\n\n` +
        `Total: ${data.total || "N/A"} MB\n` +
        `Used: ${data.used || "N/A"} MB\n` +
        `Free: ${data.free || "N/A"} MB\n` +
        `Usage: ${data.percentage || "N/A"}%\n` +
        (data.swap ? `\nSwap: ${data.swap.used || 0} / ${data.swap.total || 0} MB` : ""),
    };
  } catch (error) {
    return { success: false, text: `❌ Gagal ambil data RAM: ${error.message}` };
  }
}

/**
 * Detail Disk
 */
export async function getDiskDetail() {
  try {
    const data = await callAgent("/system/disk");
    let text = `💿 <b>DISK USAGE</b>\n`;
    if (Array.isArray(data.partitions)) {
      data.partitions.forEach((p) => {
        text += `\n📁 ${p.mount || p.filesystem}\n`;
        text += `   Size: ${p.size || "?"} | Used: ${p.used || "?"} | Avail: ${p.available || "?"}\n`;
        text += `   Usage: ${p.percentage || "?"}%`;
      });
    } else {
      text += `\nTotal: ${data.total || "N/A"}\nUsed: ${data.used || "N/A"}\nPercentage: ${data.percentage || "N/A"}%`;
    }
    return { success: true, text };
  } catch (error) {
    return { success: false, text: `❌ Gagal ambil data Disk: ${error.message}` };
  }
}

/**
 * Network info
 */
export async function getNetworkInfo() {
  try {
    const data = await callAgent("/system/network");
    let text = `🌐 <b>NETWORK INFO</b>\n`;
    if (Array.isArray(data.interfaces)) {
      data.interfaces.forEach((iface) => {
        text += `\n🔌 ${iface.name}\n`;
        text += `   IP: ${iface.address || "N/A"}\n`;
        text += `   MAC: ${iface.mac || "N/A"}`;
      });
    }
    if (data.hostname) text += `\n\n🏷️ Hostname: ${data.hostname}`;
    return { success: true, text };
  } catch (error) {
    return { success: false, text: `❌ Gagal ambil data Network: ${error.message}` };
  }
}

/**
 * Status bot WhatsApp
 */
export async function getBotStatus() {
  try {
    const data = await callAgent("/bot-status");
    const status = data.online ? "🟢 Online" : "🔴 Offline";
    return {
      success: true,
      text:
        `🤖 <b>STATUS BOT WHATSAPP</b>\n\n` +
        `Status: ${status}\n` +
        `Port: ${data.port || "3000"}\n` +
        `Uptime: ${data.uptime || "N/A"}\n` +
        `PID: ${data.pid || "N/A"}\n` +
        `Memory: ${data.memory || "N/A"} MB`,
    };
  } catch (error) {
    return { success: false, text: `🔴 <b>Bot WA tidak merespons</b>\n\n${error.message}` };
  }
}

/**
 * Restart bot WhatsApp
 */
export async function restartBot() {
  try {
    const data = await callAgent("/restart", "POST");
    return {
      success: true,
      text: `✅ <b>Restart berhasil</b>\n\n${data.message || "Bot WA sedang di-restart..."}`,
    };
  } catch (error) {
    return {
      success: false,
      text: `❌ <b>Restart gagal</b>\n\n${error.message}`,
    };
  }
}

/**
 * Bot uptime & process info
 */
export async function getBotUptime() {
  try {
    const data = await callAgent("/bot-status");
    return {
      success: true,
      text:
        `⏱️ <b>UPTIME & PROCESS</b>\n\n` +
        `🖥️ System Uptime: ${data.systemUptime || "N/A"}\n` +
        `🤖 Bot Uptime: ${data.uptime || "N/A"}\n` +
        `📊 PID: ${data.pid || "N/A"}\n` +
        `💾 Memory: ${data.memory || "N/A"} MB\n` +
        `🔄 Restarts: ${data.restarts ?? "N/A"}`,
    };
  } catch (error) {
    return { success: false, text: `❌ Gagal ambil data: ${error.message}` };
  }
}

/**
 * Process info dari VPS
 */
export async function getProcessInfo() {
  try {
    const data = await callAgent("/system/processes");
    let text = `📝 <b>PROCESS INFO</b>\n\n`;
    text += `Total Processes: ${data.total || "N/A"}\n`;
    if (Array.isArray(data.top)) {
      text += `\n<b>Top Processes:</b>\n`;
      data.top.forEach((p, i) => {
        text += `${i + 1}. ${p.name} - CPU: ${p.cpu}% RAM: ${p.memory}%\n`;
      });
    }
    return { success: true, text };
  } catch (error) {
    return { success: false, text: `❌ Gagal ambil data process: ${error.message}` };
  }
}
