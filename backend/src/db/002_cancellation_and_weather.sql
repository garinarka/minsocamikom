-- Jalankan manual setelah schema.sql awal (fase 6)
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'refunded';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'rescheduled';
