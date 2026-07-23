/**
 * Aturan dynamic pricing:
 * - Prime Time  : Senin-Jumat, 17:00-22:00  -> 130% dari base_price
 * - Off-Peak    : Senin-Jumat, sebelum 17:00 -> diskon 35% dari base_price
 * - Weekend     : Sabtu-Minggu               -> 115% dari base_price
 */
function resolvePricing(date, startTime, basePrice) {
  const day = new Date(`${date}T00:00:00`).getDay(); // 0=Minggu, 6=Sabtu
  const isWeekend = day === 0 || day === 6;
  const hour = parseInt(startTime.split(":")[0], 10);

  if (isWeekend) {
    return { priceType: "weekend", finalPrice: round2(basePrice * 1.15) };
  }

  const isPrimeTime = hour >= 17 && hour < 22;
  if (isPrimeTime) {
    return { priceType: "prime_time", finalPrice: round2(basePrice * 1.3) };
  }

  return { priceType: "off_peak", finalPrice: round2(basePrice * 0.65) };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { resolvePricing };
