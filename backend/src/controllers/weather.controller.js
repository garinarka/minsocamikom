const weatherService = require("../services/weather.service");
const bookingModel = require("../models/booking.model");
const scheduleModel = require("../models/schedule.model");
const userModel = require("../models/user.model");
const emailService = require("../services/email.service");

// GET /api/weather/check/:bookingId
async function checkRisk(req, res, next) {
  try {
    const booking = await bookingModel.getById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: "Booking tidak ditemukan" });

    const schedule = await scheduleModel.getById(booking.schedule_id);
    const result = await weatherService.checkRainRisk(schedule.date, schedule.start_time);

    if (result.risk) {
      const user = await userModel.findById(booking.user_id);
      if (user) emailService.sendWeatherAlert(user.email, booking);
    }

    res.json({ bookingId: booking.id, ...result });
  } catch (err) {
    next(err);
  }
}

// POST /api/weather/reschedule  { bookingId, newScheduleId }
async function claimReschedule(req, res, next) {
  try {
    const { bookingId, newScheduleId } = req.body;
    const booking = await bookingModel.getById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking tidak ditemukan" });
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ message: "Bukan booking milik Anda" });
    }

    const schedule = await scheduleModel.getById(booking.schedule_id);
    const risk = await weatherService.checkRainRisk(schedule.date, schedule.start_time);
    if (!risk.risk) {
      return res.status(400).json({ message: "Tidak ada risiko cuaca ekstrem terdeteksi, reschedule ditolak" });
    }

    const newBooking = await bookingModel.rescheduleBooking(bookingId, newScheduleId, scheduleModel);
    res.json({ message: "Reschedule berhasil akibat SOP cuaca ekstrem, tanpa biaya tambahan", booking: newBooking });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkRisk, claimReschedule };
