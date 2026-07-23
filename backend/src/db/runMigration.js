const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

const file = process.argv[2];
if (!file) {
  console.error("Usage: node src/db/runMigration.js migrations/002_cancellation_and_weather.sql");
  process.exit(1);
}

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, file), "utf8");
  try {
    await pool.query(sql);
    console.log(`[MIGRATE] ${file} berhasil dijalankan.`);
  } catch (err) {
    console.error(`[MIGRATE] Gagal: ${err.message}`);
  } finally {
    await pool.end();
  }
}

run();
