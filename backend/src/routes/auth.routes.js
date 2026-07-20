const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { registerRules, loginRules, validate } = require("../middleware/validators/auth.validator");

router.post("/register", registerRules, validate, authController.register);
router.post("/login", loginRules, validate, authController.login);
router.get("/me", authenticate, authController.me);

module.exports = router;
