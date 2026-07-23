const router = require("express").Router();
const fieldController = require("../controllers/field.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

router.get("/", fieldController.list);
router.get("/:id", fieldController.detail);
router.post("/", authenticate, authorize("owner", "admin"), fieldController.create);

module.exports = router;
