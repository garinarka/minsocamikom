const pool = require("../config/db");

async function create({ bookingId, xenditInvoiceId, externalId, paymentType, method, amount }) {
  const { rows } = await pool.query(
    `INSERT INTO transactions (booking_id, xendit_invoice_id, external_id, payment_type, method, amount, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     RETURNING *`,
    [bookingId, xenditInvoiceId, externalId, paymentType, method, amount]
  );
  return rows[0];
}

async function findByExternalId(externalId) {
  const { rows } = await pool.query("SELECT * FROM transactions WHERE external_id = $1", [externalId]);
  return rows[0];
}

async function updateStatus(id, status, paidAt = null) {
  const { rows } = await pool.query(
    "UPDATE transactions SET status = $1, paid_at = $2 WHERE id = $3 RETURNING *",
    [status, paidAt, id]
  );
  return rows[0];
}

async function getByBooking(bookingId) {
  const { rows } = await pool.query(
    "SELECT * FROM transactions WHERE booking_id = $1 ORDER BY created_at DESC",
    [bookingId]
  );
  return rows;
}

module.exports = { create, findByExternalId, updateStatus, getByBooking };
