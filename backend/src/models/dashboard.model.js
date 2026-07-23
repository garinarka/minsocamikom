const pool = require("../config/db");

// Okupansi lapangan dalam rentang tanggal
async function getOccupancyRate(startDate, endDate) {
  const { rows } = await pool.query(
    `SELECT f.id AS field_id, f.name AS field_name,
            COUNT(s.id) AS total_slot,
            COUNT(s.id) FILTER (WHERE s.is_booked) AS booked_slot,
            ROUND(
              (COUNT(s.id) FILTER (WHERE s.is_booked)::numeric / NULLIF(COUNT(s.id), 0)) * 100, 2
            ) AS occupancy_percent
     FROM fields f
     LEFT JOIN schedules s ON s.field_id = f.id AND s.date BETWEEN $1 AND $2
     GROUP BY f.id, f.name
     ORDER BY f.id`,
    [startDate, endDate]
  );
  return rows;
}

// Slot jam paling ramai (untuk evaluasi dynamic pricing)
async function getBusiestSlots(startDate, endDate) {
  const { rows } = await pool.query(
    `SELECT s.start_time, s.price_type,
            COUNT(b.id) AS total_booking
     FROM schedules s
     JOIN bookings b ON b.schedule_id = s.id AND b.status IN ('confirmed', 'completed')
     WHERE s.date BETWEEN $1 AND $2
     GROUP BY s.start_time, s.price_type
     ORDER BY total_booking DESC
     LIMIT 10`,
    [startDate, endDate]
  );
  return rows;
}

// Rekap arus kas: harian / mingguan / bulanan
async function getCashFlow(groupBy = "day", startDate, endDate) {
  const truncUnit = { day: "day", week: "week", month: "month" }[groupBy] || "day";
  const { rows } = await pool.query(
    `SELECT DATE_TRUNC('${truncUnit}', paid_at) AS period,
            SUM(amount) AS total_revenue,
            COUNT(*) AS total_transaksi
     FROM transactions
     WHERE status = 'paid' AND paid_at BETWEEN $1 AND $2
     GROUP BY period
     ORDER BY period`,
    [startDate, endDate]
  );
  return rows;
}

// Ringkasan profitabilitas & indikasi anomali (cegah kecurangan pencatatan)
async function getSummary(startDate, endDate) {
  const { rows } = await pool.query(
    `SELECT
        COUNT(*) FILTER (WHERE status = 'confirmed' OR status = 'completed') AS booking_sukses,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS booking_dibatalkan,
        COUNT(*) FILTER (WHERE status = 'expired') AS booking_expired,
        COALESCE(SUM(total_price) FILTER (WHERE status IN ('confirmed','completed')), 0) AS potensi_pendapatan
     FROM bookings
     WHERE created_at BETWEEN $1 AND $2`,
    [startDate, endDate]
  );

  const { rows: paidRows } = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total_diterima
     FROM transactions
     WHERE status = 'paid' AND paid_at BETWEEN $1 AND $2`,
    [startDate, endDate]
  );

  return { ...rows[0], total_diterima: paidRows[0].total_diterima };
}

module.exports = { getOccupancyRate, getBusiestSlots, getCashFlow, getSummary };
