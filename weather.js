// weather.js - Widget Prakiraan Cuaca (booking.html)
// Diadaptasi dari weather.html, memakai elemen di dalam .weather-widget

(function () {
  const API_KEY = "7771a19973c2991770825a8430b0854e";

  const cityNameEl = document.getElementById("cityName");
  const citySubtitleEl = document.getElementById("citySubtitle");
  const forecastContainer = document.getElementById("weatherForecastContainer");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const searchBtn = document.getElementById("searchBtn");
  const cityInput = document.getElementById("cityInput");

  // widget hanya berjalan jika elemen tersedia di halaman (booking.html)
  if (!cityNameEl || !forecastContainer || !searchBtn || !cityInput) return;

  searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) {
      getWeatherData(city);
    }
  });

  cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchBtn.click();
    }
  });

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

      const dailyForecasts = data.list.filter((item) =>
        item.dt_txt.includes("12:00:00"),
      );
      renderForecast(dailyForecasts);
    } catch (error) {
      cityNameEl.textContent = "Gagal memuat...";
      citySubtitleEl.textContent = error.message;
    } finally {
      loadingSpinner.classList.remove("active");
    }
  }

  // render kartu prakiraan cuaca
  function renderForecast(forecasts) {
    forecastContainer.innerHTML = "";

    forecasts.forEach((day) => {
      const dateObj = new Date(day.dt * 1000);
      const hariFormat = dateObj.toLocaleDateString("id-ID", {
        weekday: "short",
      });
      const tanggalFormat = dateObj.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });

      const temp = Math.round(day.main.temp);
      const desc = day.weather[0].description;
      const iconCode = day.weather[0].icon;
      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

      const cardHtml = `
        <div class="weather-mini-card">
          <div class="weather-mini-day">${hariFormat}</div>
          <div class="weather-mini-date">${tanggalFormat}</div>
          <img class="weather-mini-icon" src="${iconUrl}" alt="${desc}">
          <div class="weather-mini-temp">${temp}&deg;</div>
          <div class="weather-mini-desc">${desc}</div>
          <div class="weather-mini-meta">
            <span><i class="bi bi-droplet-fill"></i> ${day.main.humidity}%</span>
            <span><i class="bi bi-wind"></i> ${Math.round(day.wind.speed * 3.6)} km/j</span>
          </div>
        </div>
      `;

      forecastContainer.insertAdjacentHTML("beforeend", cardHtml);
    });
  }

  // inisialisasi kota awal
  getWeatherData("Sleman");
})();
