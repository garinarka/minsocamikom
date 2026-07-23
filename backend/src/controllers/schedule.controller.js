const scheduleModel = require("../models/schedule.model");
const fieldModel = require("../models/field.model");

// GET /api/schedules?fieldId=1&date=2026-07-25  -> kalender real-time
async function getCalendar(req, res, next) {
  try {
    const { fieldId, date } = req.query;
    if (!fieldId || !date) {
      return res.status(400).json({ message: "fieldId dan date wajib diisi" });
    }
    const schedules = await scheduleModel.getScheduleByFieldAndDate(fieldId, date);
    res.json({ schedules });
  } catch (err) {
    next(err);
  }
}

// owner/admin only: generate slot 1 hari untuk 1 lapangan (dynamic pricing otomatis)
async function generate(req, res, next) {
  try {
    const { fieldId, date } = req.body;
    const field = await fieldModel.getById(fieldId);
    if (!field) return res.status(404).json({ message: "Lapangan tidak ditemukan" });

    const schedules = await scheduleModel.generateSchedulesForDate(fieldId, date, field.base_price);
    res.status(201).json({ message: `${schedules.length} slot dibuat`, schedules });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCalendar, generate };
