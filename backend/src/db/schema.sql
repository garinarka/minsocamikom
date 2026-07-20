-- ==========================================
-- Minisoccer Amikom - Database Schema
-- ==========================================

CREATE TYPE user_role AS ENUM ('customer', 'owner', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'expired');
CREATE TYPE payment_type AS ENUM ('dp', 'full', 'settlement');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'expired');
CREATE TYPE price_type AS ENUM ('prime_time', 'off_peak', 'weekend');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE fields (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  grass_type VARCHAR(100),
  has_lighting BOOLEAN DEFAULT true,
  base_price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Slot jadwal per lapangan (sumber kalender real-time)
CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  field_id INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  price_type price_type NOT NULL,
  final_price NUMERIC(10,2) NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  UNIQUE (field_id, date, start_time)
);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  field_id INTEGER NOT NULL REFERENCES fields(id),
  schedule_id INTEGER NOT NULL REFERENCES schedules(id),
  status booking_status NOT NULL DEFAULT 'pending',
  is_non_refundable BOOLEAN DEFAULT false,
  total_price NUMERIC(10,2) NOT NULL,
  payment_deadline TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  xendit_invoice_id VARCHAR(100) UNIQUE,
  external_id VARCHAR(100) UNIQUE NOT NULL,
  payment_type payment_type NOT NULL,
  method VARCHAR(30) DEFAULT 'qris',
  amount NUMERIC(10,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index untuk performa query kalender & anti double booking
CREATE INDEX idx_schedules_field_date ON schedules(field_id, date);
CREATE UNIQUE INDEX idx_booking_active_schedule
  ON bookings(schedule_id)
  WHERE status IN ('pending', 'confirmed');
