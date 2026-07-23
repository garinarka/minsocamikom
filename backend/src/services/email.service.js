const transporter = require("../config/mailer");

async function sendMail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"Minisoccer Amikom" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("[EMAIL] Gagal kirim ke", to, err.message);
  }
}

function sendBookingConfirmation(userEmail, booking) {
  return sendMail(
    userEmail,
    "Konfirmasi Booking - Minisoccer Amikom",
    `<p>Booking #${booking.id} Anda telah <b>dikonfirmasi</b>.</p>
     <p>Total: Rp${Number(booking.total_price).toLocaleString("id-ID")}</p>`
  );
}

function sendReminder(userEmail, booking) {
  return sendMail(
    userEmail,
    "Pengingat Jadwal Main Besok - Minisoccer Amikom",
    `<p>Jangan lupa, Anda memiliki jadwal booking #${booking.id} besok pukul ${booking.start_time}.</p>
     <p>Sampai jumpa di lapangan!</p>`
  );
}

function sendWeatherAlert(userEmail, booking) {
  return sendMail(
    userEmail,
    "Peringatan Cuaca - Booking Anda",
    `<p>Prakiraan cuaca menunjukkan potensi hujan lebat pada jadwal booking #${booking.id}.</p>
     <p>Anda berhak mengajukan reschedule gratis via halaman booking.</p>`
  );
}

module.exports = { sendBookingConfirmation, sendReminder, sendWeatherAlert };
