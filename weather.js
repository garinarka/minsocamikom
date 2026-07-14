(function () {
  const API_KEY = "7771a19973c2991770825a8430b0854e";

  const cityNameEl = document.getElementById("cityName");
  const citySubtitleEl = document.getElementById("citySubtitle");
  const forecastContainer = document.getElementById("weatherForecastContainer");
  const loadingSpinner = document.getElementById("loadingSpinner");

  // async fetch data cuaca
  async function getWeatherData(city) {
    forecastContainer.innerHTML = "";
    loadingSpinner.classList.add("active");
    cityNameEl.textContent = "Memuat...";
    citySubtitleEl.textContent = "";

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=id`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Kota "${city}" tidak ditemukan atau token invalid!`);
      }

      const data = await response.json();

      cityNameEl.textContent = `${data.city.name}`;
      citySubtitleEl.textContent = `${data.city.country} · ${data.city.coord.lat}, ${data.city.coord.lon}`;

      const forecastPerSesi = getTodayForecastBySesi(data.list);
      renderForecast(forecastPerSesi);
    } catch (error) {
      cityNameEl.textContent = "Gagal memuat...";
      citySubtitleEl.textContent = error.message;
    } finally {
      loadingSpinner.classList.remove("active");
    }
  }

  // definisi jam sesi, disamakan dengan aturan sesi booking (pagi/sore/malam)
  const sesiConfig = [
    { key: "pagi", label: "Pagi", jamMulai: 6, jamSelesai: 10 },
    { key: "sore", label: "Sore", jamMulai: 15, jamSelesai: 18 },
    { key: "malam", label: "Malam", jamMulai: 18, jamSelesai: 23 },
  ];

  function pad2(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  // ambil data forecast HARI INI saja, dikelompokkan per sesi (pagi/sore/malam)
  function getTodayForecastBySesi(list) {
    const sekarang = new Date();

    return sesiConfig.map((sesi) => {
      const kandidat = list.filter((item) => {
        const waktu = new Date(item.dt * 1000);
        return (
          waktu.toDateString() === sekarang.toDateString() &&
          waktu.getHours() >= sesi.jamMulai &&
          waktu.getHours() < sesi.jamSelesai
        );
      });

      // ambil data di titik tengah rentang sesi biar paling representatif
      const dataTerpilih = kandidat[Math.floor(kandidat.length / 2)] || null;

      return { sesi, data: dataTerpilih };
    });
  }

  // render kartu prakiraan cuaca per sesi (hari ini saja)
  function renderForecast(forecasts) {
    forecastContainer.innerHTML = "";

    forecasts.forEach(({ sesi, data }) => {
      const rentangJam = `${pad2(sesi.jamMulai)}.00 - ${pad2(sesi.jamSelesai)}.00`;

      if (!data) {
        const cardHtml = `
          <div class="weather-mini-card">
            <div class="weather-mini-day">${sesi.label}</div>
            <div class="weather-mini-date">${rentangJam}</div>
            <div class="weather-mini-desc" style="min-height:auto; margin-top:14px;">Data belum tersedia</div>
          </div>
        `;
        forecastContainer.insertAdjacentHTML("beforeend", cardHtml);
        return;
      }

      const temp = Math.round(data.main.temp);
      const desc = data.weather[0].description;
      const iconCode = data.weather[0].icon;
      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

      const cardHtml = `
        <div class="weather-mini-card">
          <div class="weather-mini-day">${sesi.label}</div>
          <div class="weather-mini-date">${rentangJam}</div>
          <img class="weather-mini-icon" src="${iconUrl}" alt="${desc}">
          <div class="weather-mini-temp">${temp}&deg;</div>
          <div class="weather-mini-desc">${desc}</div>
          <div class="weather-mini-meta">
            <span><i class="bi bi-droplet-fill"></i> ${data.main.humidity}%</span>
            <span><i class="bi bi-wind"></i> ${Math.round(data.wind.speed * 3.6)} km/j</span>
          </div>
        </div>
      `;

      forecastContainer.insertAdjacentHTML("beforeend", cardHtml);
    });
  }

  // inisialisasi kota awal
  getWeatherData("Sleman");
})();
