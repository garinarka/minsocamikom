const pool = require("../config/db");
const { resolvePricing } = require("../utils/pricing");

const SLOT_START_HOUR = 8; // jam buka 08:00
const SLOT_END_HOUR = 23; // jam tutup 23:00

// Generate slot 1 jam untuk 1 lapangan pada 1 tanggal tertentu
async function generateSchedulesForDate(fieldId, date, basePrice) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const created = [];
    for (let hour = SLOT_START_HOUR; hour < SLOT_END_HOUR; hour++) {
      const startTime = `${String(hour).padStart(2, "0")}:00`;
      const endTime = `${String(hour + 1).padStart(2, "0")}:00`;
      const { priceType, finalPrice } = resolvePricing(date, startTime, basePrice);

      const { rows } = await client.query(
        `INSERT INTO schedules (field_id, date, start_time, end_time, price_type, final_price)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (field_id, date, start_time) DO NOTHING
         RETURNING *`,
        [fieldId, date, startTime, endTime, priceType, finalPrice]
      );
      if (rows[0]) created.push(rows[0]);
    }
    await client.query("COMMIT");
    return created;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Kalender real-time: semua slot pada 1 tanggal + status ketersediaan
async function getScheduleByFieldAndDate(fieldId, date) {
  const { rows } = await pool.query(
    `SELECT * FROM schedules WHERE field_id = $1 AND date = $2 ORDER BY start_time`,
    [fieldId, date]
  );
  return rows;
}

async function getById(id) {
  const { rows } = await pool.query("SELECT * FROM schedules WHERE id = $1", [id]);
  return rows[0];
}

// Lock baris slot di dalam transaksi (mencegah race condition saat 2 booking bersamaan)
async function lockForUpdate(client, scheduleId) {
  const { rows } = await client.query(
    "SELECT * FROM schedules WHERE id = $1 FOR UPDATE",
    [scheduleId]
  );
  return rows[0];
}

async function markBooked(client, scheduleId, isBooked) {
  await client.query("UPDATE schedules SET is_booked = $1 WHERE id = $2", [isBooked, scheduleId]);
}

module.exports = {
  generateSchedulesForDate,
  getScheduleByFieldAndDate,
  getById,
  lockForUpdate,
  markBooked,
};
