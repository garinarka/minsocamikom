const https = require("https");

// Koordinat tetap kompleks lapangan (Amikom Yogyakarta)
const LAT = -7.7639;
const LON = 110.4108;
const RAIN_RISK_THRESHOLD_MM = 4; // curah hujan (mm/3jam) dianggap "hujan lebat"

function fetchForecast() {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}

// Cari slot forecast 3-jam terdekat dengan tanggal+jam booking, evaluasi risiko hujan lebat
async function checkRainRisk(date, startTime) {
  const forecast = await fetchForecast();
  if (!forecast.list) return { risk: false, reason: "Data cuaca tidak tersedia" };

  const targetTs = new Date(`${date}T${startTime}:00`).getTime();
  let closest = null;
  let minDiff = Infinity;

  for (const item of forecast.list) {
    const diff = Math.abs(item.dt * 1000 - targetTs);
    if (diff < minDiff) {
      minDiff = diff;
      closest = item;
    }
  }

  if (!closest) return { risk: false, reason: "Slot prakiraan tidak ditemukan" };

  const rainVolume = closest.rain?.["3h"] || 0;
  const risk = rainVolume >= RAIN_RISK_THRESHOLD_MM;

  return {
    risk,
    rainVolume,
    weatherDescription: closest.weather?.[0]?.description || "-",
    reason: risk
      ? `Prakiraan curah hujan ${rainVolume}mm, berpotensi hujan lebat`
      : "Cuaca dalam batas aman",
  };
}

module.exports = { checkRainRisk };
