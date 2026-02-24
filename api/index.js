// Root handler - status page
export default function handler(req, res) {
  res.status(200).json({
    name: "Botscan - Telegram VPS Monitor",
    status: "running",
    endpoints: {
      webhook: "/api/webhook",
      cron: "/api/cron",
    },
    timestamp: new Date().toISOString(),
  });
}
