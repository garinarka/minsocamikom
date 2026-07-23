const pool = require("../config/db");

async function getAll() {
  const { rows } = await pool.query("SELECT * FROM fields WHERE is_active = true ORDER BY id");
  return rows;
}

async function getById(id) {
  const { rows } = await pool.query("SELECT * FROM fields WHERE id = $1", [id]);
  return rows[0];
}

async function create({ name, description, grassType, hasLighting, basePrice }) {
  const { rows } = await pool.query(
    `INSERT INTO fields (name, description, grass_type, has_lighting, base_price)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, description, grassType, hasLighting, basePrice]
  );
  return rows[0];
}

module.exports = { getAll, getById, create };
