const router = require("express").Router();
const bookingController = require("../controllers/booking.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

router.post("/", authenticate, authorize("customer"), bookingController.create);
router.get("/me", authenticate, bookingController.myBookings);
router.patch("/:id/cancel", authenticate, bookingController.cancel);

module.exports = router;
