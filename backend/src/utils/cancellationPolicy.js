const FREE_CANCEL_DAYS = 3; // gratis batal jika masih H-3 atau lebih

/**
 * Tentukan apakah booking berhak refund saat dibatalkan.
 * - non-refundable  -> tidak pernah refund (harga sudah lebih murah di awal)
 * - refundable      -> refund penuh jika dibatalkan >= H-3, tidak refund jika kurang dari itu
 */
function evaluateCancellation(booking, scheduleDate) {
  if (booking.is_non_refundable) {
    return { eligibleForRefund: false, reason: "Paket non-refundable, tidak ada pengembalian dana" };
  }

  const daysBefore = Math.floor(
    (new Date(scheduleDate) - new Date()) / (1000 * 60 * 60 * 24)
  );

  if (daysBefore >= FREE_CANCEL_DAYS) {
    return { eligibleForRefund: true, reason: `Dibatalkan H-${daysBefore}, memenuhi syarat refund penuh` };
  }

  return {
    eligibleForRefund: false,
    reason: `Dibatalkan kurang dari H-${FREE_CANCEL_DAYS}, tidak memenuhi syarat refund`,
  };
}

module.exports = { evaluateCancellation, FREE_CANCEL_DAYS };
