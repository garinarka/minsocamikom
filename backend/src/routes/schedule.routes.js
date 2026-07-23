const router = require("express").Router();
const scheduleController = require("../controllers/schedule.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

router.get("/", scheduleController.getCalendar);
router.post("/generate", authenticate, authorize("owner", "admin"), scheduleController.generate);

module.exports = router;
