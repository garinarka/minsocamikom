const router = require("express").Router();
const dashboardController = require("../controllers/dashboard.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

router.use(authenticate, authorize("owner", "admin"));

router.get("/occupancy", dashboardController.occupancy);
router.get("/busiest-slots", dashboardController.busiestSlots);
router.get("/cash-flow", dashboardController.cashFlow);
router.get("/summary", dashboardController.summary);

module.exports = router;
