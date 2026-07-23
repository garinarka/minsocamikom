const app = require("./app");
const { startAutoCancelJob } = require("./jobs/autoCancelBooking.job");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[SERVER] Berjalan di http://localhost:${PORT}`);
  startAutoCancelJob();
});
