const { Xendit } = require("xendit-node");
require("dotenv").config();

const xenditClient = new Xendit({ secretKey: process.env.XENDIT_SECRET_KEY });

module.exports = xenditClient;
