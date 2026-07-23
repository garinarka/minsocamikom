function generateExternalId(bookingId, paymentType) {
  return `MSA-${bookingId}-${paymentType}-${Date.now()}`;
}

module.exports = { generateExternalId };
