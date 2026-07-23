const xenditClient = require("../config/xendit");
const transactionModel = require("../models/transaction.model");
const bookingModel = require("../models/booking.model");
const scheduleModel = require("../models/schedule.model");
const { generateExternalId } = require("../utils/externalId");
const pool = require("../config/db");

const DP_PERCENTAGE = 0.5; // uang muka 50% dari total harga

// POST /api/payments/invoice  { bookingId, paymentType: 'dp' | 'full' | 'settlement' }
async function createInvoice(req, res, next) {
  try {
    const { bookingId, paymentType } = req.body;
    const booking = await bookingModel.getById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking tidak ditemukan" });
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ message: "Bukan booking milik Anda" });
    }
    if (booking.status !== "pending") {
      return res.status(400).json({ message: "Booking tidak dalam status menunggu pembayaran" });
    }

    let amount = Number(booking.total_price);
    if (paymentType === "dp") {
      amount = round2(booking.total_price * DP_PERCENTAGE);
    } else if (paymentType === "settlement") {
      const prevTx = await transactionModel.getByBooking(bookingId);
      const paidBefore = prevTx
        .filter((t) => t.status === "paid" && t.payment_type === "dp")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      amount = round2(booking.total_price - paidBefore);
      if (amount <= 0) {
        return res.status(400).json({ message: "Tidak ada sisa tagihan untuk pelunasan" });
      }
    }

    const externalId = generateExternalId(bookingId, paymentType);
    const durationSeconds = Math.max(
      60,
      Math.floor((new Date(booking.payment_deadline) - Date.now()) / 1000)
    );

    const { Invoice } = xenditClient;
    const invoice = await Invoice.createInvoice({
      data: {
        externalId,
        amount,
        payerEmail: req.user.email,
        description: `Pembayaran ${paymentType.toUpperCase()} booking #${bookingId} - Minisoccer Amikom`,
        currency: "IDR",
        invoiceDuration: durationSeconds,
        paymentMethods: ["QRIS"],
        successRedirectUrl: `${process.env.FRONTEND_URL}/booking-sukses.html`,
        failureRedirectUrl: `${process.env.FRONTEND_URL}/booking.html`,
      },
    });

    const transaction = await transactionModel.create({
      bookingId,
      xenditInvoiceId: invoice.id,
      externalId,
      paymentType,
      method: "qris",
      amount,
    });

    res.status(201).json({
      message: "Invoice dibuat",
      invoiceUrl: invoice.invoiceUrl,
      transaction,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/payments/webhook  (dipanggil Xendit)
async function webhook(req, res, next) {
  const client = await pool.connect();
  try {
    const token = req.headers["x-callback-token"];
    if (token !== process.env.XENDIT_CALLBACK_TOKEN) {
      return res.status(401).json({ message: "Callback token tidak valid" });
    }

    const { external_id, status, paid_at } = req.body;
    const transaction = await transactionModel.findByExternalId(external_id);
    if (!transaction) return res.status(404).json({ message: "Transaksi tidak ditemukan" });

    const booking = await bookingModel.getById(transaction.booking_id);

    if (status === "PAID") {
      await transactionModel.updateStatus(transaction.id, "paid", paid_at || new Date());
      await bookingModel.updateStatus(booking.id, "confirmed");
    } else if (status === "EXPIRED") {
      await transactionModel.updateStatus(transaction.id, "expired");
      // Hanya lepas slot jika belum ada pembayaran lain yang berhasil (mis. DP sudah cair)
      if (booking.status === "pending") {
        await client.query("BEGIN");
        await bookingModel.cancelAndReleaseSlot(client, booking.id, booking.schedule_id, "expired");
        await client.query("COMMIT");
      }
    }

    res.json({ received: true });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    next(err);
  } finally {
    client.release();
  }
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { createInvoice, webhook };
