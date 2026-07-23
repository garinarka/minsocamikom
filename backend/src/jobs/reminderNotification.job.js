const bookingModel = require("../models/booking.model");
const emailService = require("../services/email.service");

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // cek tiap 1 jam
const alreadySent = new Set(); // dedup sederhana in-memory: `${bookingId}-${date}`

async function sendTomorrowReminders() {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  try {
    const bookings = await bookingModel.getConfirmedForDate(tomorrow);
    for (const booking of bookings) {
      const key = `${booking.id}-${tomorrow}`;
      if (alreadySent.has(key)) continue;
      await emailService.sendReminder(booking.email, booking);
      alreadySent.add(key);
    }
    if (bookings.length > 0) {
      console.log(`[REMINDER] ${bookings.length} email reminder terkirim untuk ${tomorrow}`);
    }
  } catch (err) {
    console.error("[REMINDER] Gagal:", err.message);
  }
}

function startReminderJob() {
  setInterval(sendTomorrowReminders, CHECK_INTERVAL_MS);
  console.log("[REMINDER] Job berjalan tiap 1 jam (cek booking H-1)");
}

module.exports = { startReminderJob };
