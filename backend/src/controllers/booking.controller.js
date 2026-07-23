const bookingModel = require("../models/booking.model");
const scheduleModel = require("../models/schedule.model");
const transactionModel = require("../models/transaction.model");
const { evaluateCancellation } = require("../utils/cancellationPolicy");
const pool = require("../config/db");

// customer only
async function create(req, res, next) {
  try {
    const { scheduleId, isNonRefundable } = req.body;
    const booking = await bookingModel.createBooking({
      userId: req.user.id,
      scheduleModel,
      scheduleId,
      isNonRefundable: !!isNonRefundable,
    });
    res.status(201).json({
      message: "Booking dibuat, segera lakukan pembayaran sebelum batas waktu",
      booking,
    });
  } catch (err) {
    next(err);
  }
}

async function myBookings(req, res, next) {
  try {
    const bookings = await bookingModel.getByUser(req.user.id);
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
}

// cancel oleh customer (pending atau sudah confirmed), tunduk kebijakan refund H-3
async function cancel(req, res, next) {
  const client = await pool.connect();
  try {
    const booking = await bookingModel.getById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking tidak ditemukan" });
    if (booking.user_id !== req.user.id && req.user.role === "customer") {
      return res.status(403).json({ message: "Bukan booking milik Anda" });
    }
    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({ message: "Booking tidak bisa dibatalkan pada status ini" });
    }

    const schedule = await scheduleModel.getById(booking.schedule_id);
    const policy = evaluateCancellation(booking, schedule.date);

    await client.query("BEGIN");
    await bookingModel.cancelAndReleaseSlot(client, booking.id, booking.schedule_id, "cancelled");

    if (policy.eligibleForRefund) {
      const paidTx = (await transactionModel.getByBooking(booking.id)).find(
        (t) => t.status === "paid"
      );
      if (paidTx) {
        await client.query("UPDATE transactions SET status = 'refunded' WHERE id = $1", [paidTx.id]);
      }
    }
    await client.query("COMMIT");

    res.json({
      message: "Booking dibatalkan, slot kembali tersedia",
      refundPolicy: policy,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

module.exports = { create, myBookings, cancel };
