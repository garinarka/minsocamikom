const pool = require("../config/db");

const CHECK_INTERVAL_MS = 60 * 1000; // cek tiap 1 menit

async function releaseExpiredBookings() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT id, schedule_id FROM bookings
       WHERE status = 'pending' AND payment_deadline < NOW()
       FOR UPDATE`
    );

    for (const booking of rows) {
      await client.query(
        "UPDATE bookings SET status = 'expired', updated_at = NOW() WHERE id = $1",
        [booking.id]
      );
      await client.query("UPDATE schedules SET is_booked = false WHERE id = $1", [
        booking.schedule_id,
      ]);
    }

    await client.query("COMMIT");
    if (rows.length > 0) {
      console.log(`[AUTO-CANCEL] ${rows.length} booking expired dilepas kembali`);
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[AUTO-CANCEL] Gagal:", err.message);
  } finally {
    client.release();
  }
}

function startAutoCancelJob() {
  setInterval(releaseExpiredBookings, CHECK_INTERVAL_MS);
  console.log("[AUTO-CANCEL] Job berjalan tiap 60 detik");
}

module.exports = { startAutoCancelJob };
