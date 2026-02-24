# BOTSCAN - Telegram VPS Monitor Bot

Bot Telegram untuk monitoring VPS dan Bot WhatsApp (botwa) dengan inline buttons interaktif.

## Arsitektur

```
┌─────────────────────┐     ┌──────────────────────┐
│    VERCEL (Cloud)    │     │      VPS (Lokal)      │
│                      │     │                       │
│  ┌────────────────┐  │     │  ┌─────────────────┐  │
│  │   botscan      │  │ HTTP│  │  VPS Agent       │  │
│  │   (Telegram    │◄─┼─────┼─►│  (port 3001)     │  │
│  │    Webhook)    │  │     │  └─────────────────┘  │
│  └────────────────┘  │     │          │             │
│         │            │     │          ▼             │
│  ┌────────────────┐  │     │  ┌─────────────────┐  │
│  │   Cron Job     │  │     │  │  botwa           │  │
│  │   (5 menit)    │──┼─────┼─►│  (port 3000)     │  │
│  └────────────────┘  │     │  └─────────────────┘  │
└─────────┬────────────┘     └───────────────────────┘
          │
          ▼
  ┌────────────────┐
  │  Google Sheets  │ ◄── Shared data (log chat, users)
  └────────────────┘
```

## Fitur

### Menu Utama (Inline Buttons)
- 📊 **VPS Status** - CPU, RAM, Disk, Uptime, status botwa
- 💻 **System Info** - Detail CPU, RAM, Disk, Network
- 📝 **Log Chat** - 10 log terakhir, filter spam/error/sukses
- 🛡️ **Spam Stats** - Statistik spam, muted users
- 👥 **Users** - Daftar user & admin dari Google Sheets
- ⚙️ **Bot Control** - Status, restart, uptime, process info

### Push Notification (Otomatis)
- 🚨 Alert jika VPS offline (cek setiap 5 menit)
- ⚠️ Alert jika Bot WA offline tapi VPS masih hidup

### Keamanan
- Hanya admin yang terdaftar (Telegram user ID) yang bisa akses
- VPS Agent dilindungi secret token
- Non-admin yang coba akses akan ditolak

## Setup

### Langkah 1: Buat Bot Telegram
1. Buka [@BotFather](https://t.me/BotFather) di Telegram
2. Kirim `/newbot`
3. Ikuti instruksi, beri nama bot (contoh: "VPS Monitor Bot")
4. Simpan **Bot Token** yang diberikan
5. Set commands:
   ```
   /setcommands
   start - Menu utama
   status - Quick VPS status
   help - Bantuan
   ```

### Langkah 2: Dapatkan Telegram User ID
1. Buka [@userinfobot](https://t.me/userinfobot) di Telegram
2. Kirim `/start`
3. Catat **User ID** kamu (angka)

### Langkah 3: Setup botscan (Vercel)
1. Masuk ke folder botscan:
   ```bash
   cd botscan
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Buat file `.env` (copy dari `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Isi environment variables:
   ```env
   TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
   TELEGRAM_ADMIN_IDS=123456789
   VPS_AGENT_URL=http://IP_VPS_KAMU:3001
   VPS_AGENT_SECRET=secret_random_kamu
   GOOGLE_LOG_SHEET_ID=id_sheet_log_botwa
   GOOGLE_CLIENT_EMAIL=email_service_account
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

5. Deploy ke Vercel:
   ```bash
   npx vercel --prod
   ```
   Atau hubungkan repo ke Vercel dashboard.

6. Set environment variables di Vercel:
   - Buka https://vercel.com → project → Settings → Environment Variables
   - Tambahkan semua variable dari `.env`

7. Set webhook Telegram:
   ```bash
   # Set WEBHOOK_URL ke URL Vercel kamu
   WEBHOOK_URL=https://nama-project.vercel.app/api/webhook node scripts/setWebhook.js
   ```

### Langkah 4: Setup VPS Agent
1. Di VPS, masuk ke folder agent:
   ```bash
   cd botwa/agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Buat file `.env`:
   ```bash
   cp .env.example .env
   ```

4. Isi config:
   ```env
   AGENT_PORT=3001
   AGENT_SECRET=secret_random_sama_dengan_botscan
   BOTWA_PORT=3000
   BOTWA_PM2_NAME=botwa
   ```

5. Jalankan agent:
   ```bash
   # Dengan PM2 (disarankan):
   pm2 start server.js --name vps-agent
   
   # Atau langsung:
   node server.js
   ```

6. Pastikan port 3001 terbuka di firewall:
   ```bash
   # UFW (Ubuntu):
   sudo ufw allow 3001
   
   # Atau iptables:
   sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
   ```

### Langkah 5: Verifikasi
1. Buka bot Telegram kamu
2. Kirim `/start`
3. Klik tombol "📊 VPS Status"
4. Pastikan data VPS muncul dengan benar

## Troubleshooting

### Bot tidak merespons
- Cek webhook: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
- Pastikan Vercel deploy sukses
- Cek Vercel function logs di dashboard

### VPS Status "Offline"
- Pastikan VPS Agent berjalan: `pm2 status`
- Cek port terbuka: `curl http://IP:3001/health`
- Pastikan `VPS_AGENT_URL` benar di env Vercel
- Pastikan `VPS_AGENT_SECRET` sama di kedua sisi

### Log Chat kosong
- Pastikan `GOOGLE_LOG_SHEET_ID` benar dan sama dengan botwa
- Pastikan service account punya akses ke sheet
- Cek apakah botwa sudah menulis log ke Sheet3

## Struktur File

```
botscan/                    # Telegram Bot (Vercel)
├── api/
│   ├── webhook.js          # Handler webhook Telegram
│   └── cron.js             # Health check cron (5 menit)
├── lib/
│   ├── telegramApi.js      # Telegram Bot API wrapper
│   ├── menus.js            # Definisi inline buttons
│   ├── vpsClient.js        # Komunikasi dengan VPS Agent
│   └── sheetReader.js      # Baca data dari Google Sheets
├── scripts/
│   └── setWebhook.js       # Script set webhook
├── .env.example
├── .gitignore
├── package.json
├── vercel.json
└── README.md

botwa/agent/                # VPS Agent (jalan di VPS)
├── server.js               # Express server monitoring
├── .env.example
└── package.json
```
