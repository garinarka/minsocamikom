const bcrypt = require("bcryptjs");
const userModel = require("../models/user.model");
const { signToken } = require("../utils/jwt");

async function register(req, res, next) {
  try {
    const { name, email, phone, password, role } = req.body;

    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Email sudah terdaftar" });
    }

    // role hanya boleh 'customer' via public register.
    // role owner/admin dibuat manual oleh admin (fase manajemen user).
    const safeRole = role === "owner" || role === "admin" ? "customer" : role || "customer";

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userModel.createUser({ name, email, phone, passwordHash, role: safeRole });

    const token = signToken({ id: user.id, role: user.role, email: user.email });
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    const token = signToken({ id: user.id, role: user.role, email: user.email });
    delete user.password_hash;
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
