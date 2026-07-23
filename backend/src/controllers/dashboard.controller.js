const dashboardModel = require("../models/dashboard.model");

function parseRange(req) {
  const today = new Date().toISOString().slice(0, 10);
  const startDate = req.query.startDate || `${today.slice(0, 7)}-01`; // awal bulan berjalan
  const endDate = req.query.endDate || today;
  return { startDate, endDate };
}

async function occupancy(req, res, next) {
  try {
    const { startDate, endDate } = parseRange(req);
    const data = await dashboardModel.getOccupancyRate(startDate, endDate);
    res.json({ startDate, endDate, occupancy: data });
  } catch (err) {
    next(err);
  }
}

async function busiestSlots(req, res, next) {
  try {
    const { startDate, endDate } = parseRange(req);
    const data = await dashboardModel.getBusiestSlots(startDate, endDate);
    res.json({ startDate, endDate, busiestSlots: data });
  } catch (err) {
    next(err);
  }
}

async function cashFlow(req, res, next) {
  try {
    const { startDate, endDate } = parseRange(req);
    const groupBy = ["day", "week", "month"].includes(req.query.groupBy)
      ? req.query.groupBy
      : "day";
    const data = await dashboardModel.getCashFlow(groupBy, startDate, endDate);
    res.json({ startDate, endDate, groupBy, cashFlow: data });
  } catch (err) {
    next(err);
  }
}

async function summary(req, res, next) {
  try {
    const { startDate, endDate } = parseRange(req);
    const data = await dashboardModel.getSummary(startDate, endDate);
    res.json({ startDate, endDate, summary: data });
  } catch (err) {
    next(err);
  }
}

module.exports = { occupancy, busiestSlots, cashFlow, summary };
