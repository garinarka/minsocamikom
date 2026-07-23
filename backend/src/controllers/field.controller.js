const fieldModel = require("../models/field.model");

async function list(req, res, next) {
  try {
    const fields = await fieldModel.getAll();
    res.json({ fields });
  } catch (err) {
    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const field = await fieldModel.getById(req.params.id);
    if (!field) return res.status(404).json({ message: "Lapangan tidak ditemukan" });
    res.json({ field });
  } catch (err) {
    next(err);
  }
}

// owner/admin only
async function create(req, res, next) {
  try {
    const { name, description, grassType, hasLighting, basePrice } = req.body;
    const field = await fieldModel.create({ name, description, grassType, hasLighting, basePrice });
    res.status(201).json({ field });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, detail, create };
