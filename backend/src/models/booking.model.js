const pool = require("../config/db");

const PAYMENT_WINDOW_MINUTES = 15; // batas waktu bayar sebelum slot dilepas lagi

/**
 * Buat booking dalam 1 DB transaction:
 * 1. Lock baris schedule (FOR UPDATE) -> cegah race condition
 * 2. Pastikan slot belum di-booking
 * 3. Insert booking (unique index DB jadi lapisan proteksi kedua)
 * 4. Tandai schedule is_booked = true
 */
async function createBooking({ userId, scheduleModel, scheduleId, isNonRefundable }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const schedule = await scheduleModel.lockForUpdate(client, scheduleId);
    if (!schedule) {
      throw httpError(404, "Slot jadwal tidak ditemukan");
    }
    if (schedule.is_booked) {
      throw httpError(409, "Slot sudah dibooking, silakan pilih slot lain");
    }

    const deadline = new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000);

    const { rows } = await client.query(
      `INSERT INTO bookings (user_id, field_id, schedule_id, status, is_non_refundable, total_price, payment_deadline)
       VALUES ($1, $2, $3, 'pending', $4, $5, $6)
       RETURNING *`,
      [userId, schedule.field_id, scheduleId, isNonRefundable, schedule.final_price, deadline]
    );

    await scheduleModel.markBooked(client, scheduleId, true);
    await client.query("COMMIT");
    return rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function getById(id) {
  const { rows } = await pool.query("SELECT * FROM bookings WHERE id = $1", [id]);
  return rows[0];
}

async function getByUser(userId) {
  const { rows } = await pool.query(
    `SELECT b.*, f.name AS field_name, s.date, s.start_time, s.end_time
     FROM bookings b
     JOIN fields f ON f.id = b.field_id
     JOIN schedules s ON s.id = b.schedule_id
     WHERE b.user_id = $1
     ORDER BY b.created_at DESC`,
    [userId]
  );
  return rows;
}

async function updateStatus(bookingId, status) {
  const { rows } = await pool.query(
    "UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
    [status, bookingId]
  );
  return rows[0];
}

// Batalkan booking + lepas kembali slot (dipakai saat cancel manual / expired oleh Xendit webhook di Fase 4)
async function cancelAndReleaseSlot(client, bookingId, scheduleId, status = "cancelled") {
  await client.query("UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2", [
    status,
    bookingId,
  ]);
  await client.query("UPDATE schedules SET is_booked = false WHERE id = $1", [scheduleId]);
}

// Reschedule booking (SOP cuaca ekstrem): lepas slot lama, pindah ke slot baru tanpa biaya tambahan
async function rescheduleBooking(oldBookingId, newScheduleId, scheduleModel) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: oldRows } = await client.query(
      "SELECT * FROM bookings WHERE id = $1 FOR UPDATE",
      [oldBookingId]
    );
    const oldBooking = oldRows[0];
    if (!oldBooking) throw httpError(404, "Booking lama tidak ditemukan");

    const newSchedule = await scheduleModel.lockForUpdate(client, newScheduleId);
    if (!newSchedule) throw httpError(404, "Slot baru tidak ditemukan");
    if (newSchedule.is_booked) throw httpError(409, "Slot baru sudah dibooking");

    await client.query(
      "UPDATE bookings SET status = 'rescheduled', updated_at = NOW() WHERE id = $1",
      [oldBookingId]
    );
    await client.query("UPDATE schedules SET is_booked = false WHERE id = $1", [
      oldBooking.schedule_id,
    ]);

    const { rows: newRows } = await client.query(
      `INSERT INTO bookings (user_id, field_id, schedule_id, status, is_non_refundable, total_price, payment_deadline)
       VALUES ($1, $2, $3, 'confirmed', $4, $5, NOW())
       RETURNING *`,
      [
        oldBooking.user_id,
        newSchedule.field_id,
        newScheduleId,
        oldBooking.is_non_refundable,
        oldBooking.total_price,
      ]
    );
    await scheduleModel.markBooked(client, newScheduleId, true);

    await client.query("COMMIT");
    return newRows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Booking confirmed dengan jadwal besok -> dipakai job reminder & cek cuaca
async function getConfirmedForDate(date) {
  const { rows } = await pool.query(
    `SELECT b.*, u.email, s.date, s.start_time
     FROM bookings b
     JOIN users u ON u.id = b.user_id
     JOIN schedules s ON s.id = b.schedule_id
     WHERE b.status = 'confirmed' AND s.date = $1`,
    [date]
  );
  return rows;
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = {
  createBooking,
  getById,
  getByUser,
  updateStatus,
  cancelAndReleaseSlot,
  getConfirmedForDate,
  rescheduleBooking,
  PAYMENT_WINDOW_MINUTES,
};
