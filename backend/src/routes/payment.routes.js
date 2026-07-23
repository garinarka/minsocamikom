const router = require("express").Router();
const paymentController = require("../controllers/payment.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.post("/invoice", authenticate, paymentController.createInvoice);
router.post("/webhook", paymentController.webhook); // dipanggil Xendit, tanpa JWT, verifikasi via x-callback-token

module.exports = router;
