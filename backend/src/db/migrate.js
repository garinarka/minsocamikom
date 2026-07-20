const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  try {
    await pool.query(sql);
    console.log("[MIGRATE] Schema berhasil dibuat.");
  } catch (err) {
    console.error("[MIGRATE] Gagal:", err.message);
  } finally {
    await pool.end();
  }
}

migrate();
