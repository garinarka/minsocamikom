const { body, validationResult } = require("express-validator");

const registerRules = [
  body("name").trim().notEmpty().withMessage("Nama wajib diisi"),
  body("email").isEmail().withMessage("Email tidak valid"),
  body("phone").optional().isMobilePhone("id-ID").withMessage("Nomor HP tidak valid"),
  body("password").isLength({ min: 6 }).withMessage("Password minimal 6 karakter"),
];

const loginRules = [
  body("email").isEmail().withMessage("Email tidak valid"),
  body("password").notEmpty().withMessage("Password wajib diisi"),
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

module.exports = { registerRules, loginRules, validate };
