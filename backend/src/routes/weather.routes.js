const router = require("express").Router();
const weatherController = require("../controllers/weather.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.get("/check/:bookingId", authenticate, weatherController.checkRisk);
router.post("/reschedule", authenticate, weatherController.claimReschedule);

module.exports = router;
