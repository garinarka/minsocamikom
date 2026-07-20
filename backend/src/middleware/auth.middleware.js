const { verifyToken } = require("../utils/jwt");

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token tidak ditemukan" });
  }
  try {
    const token = header.split(" ")[1];
    const decoded = verifyToken(token);
    req.user = decoded; // { id, role, email }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token tidak valid atau kedaluwarsa" });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Akses ditolak untuk role ini" });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
