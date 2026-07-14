// set tanggal default quick check = hari ini
const qTgl = document.getElementById("quickTanggal");
if (qTgl) {
  const t = new Date();
  qTgl.min = t.toISOString().split("T")[0];
  qTgl.value = t.toISOString().split("T")[0];
}

// Blok 1: Kalkulator Harga Otomatis
const hargaTabel = {
  pagi: { weekday: 80000, weekend: 100000 },
  sore: { weekday: 100000, weekend: 120000 },
  malam: { weekday: 120000, weekend: 150000 },
};

const jamInput = document.getElementById("jam");
const tanggalInput = document.getElementById("tanggal");
const durasiInput = document.getElementById("durasi");
const totalHargaEl = document.getElementById("totalHarga");

function getSesi(jamStr) {
  const jam = parseInt(jamStr.split(":")[0]);
  if (jam >= 6 && jam < 10) return "pagi";
  if (jam >= 15 && jam < 18) return "sore";
  if (jam >= 18 && jam < 23) return "malam";
  return null;
}

function isWeekend(tanggalStr) {
  const day = new Date(tanggalStr).getDay();
  return day === 0 || day === 6;
}

function hitungTotal() {
  if (!totalHargaEl) return;

  const durasi = parseInt(durasiInput.value) || 0;
  const sesi = jamInput.value ? getSesi(jamInput.value) : null;
  const weekend = tanggalInput.value ? isWeekend(tanggalInput.value) : false;

  if (!sesi || !durasi) {
    totalHargaEl.textContent = "Total Harga: Rp0";
    return;
  }

  const hargaPerJam = weekend
    ? hargaTabel[sesi].weekend
    : hargaTabel[sesi].weekday;
  const total = hargaPerJam * durasi;

  totalHargaEl.textContent = `Total Harga: Rp${total.toLocaleString("id-ID")} (${sesi}, ${weekend ? "weekend" : "weekday"})`;
}

if (durasiInput) durasiInput.addEventListener("change", hitungTotal);
if (jamInput) jamInput.addEventListener("change", hitungTotal);
if (tanggalInput) tanggalInput.addEventListener("change", hitungTotal);

// Validasi tanggal & jam
if (tanggalInput) {
  tanggalInput.min = new Date().toISOString().split("T")[0];
}

// Blok 2: Validasi Form & Booking Summary
const bookingForm = document.getElementById("bookingForm");
const btnRingkasan = document.getElementById("btnRingkasan");
const btnKonfirmasi = document.getElementById("btnKonfirmasi");

if (bookingForm) {
  bookingForm.addEventListener("submit", function (e) {
    e.preventDefault();
  });
}

if (btnRingkasan) {
  btnRingkasan.addEventListener("click", () => {
    const jamVal = jamInput.value;
    const tglVal = tanggalInput.value;

    jamInput.setCustomValidity(
      jamVal && !getSesi(jamVal)
        ? "Jam di luar operasional (06-10, 15-18, 18-23)"
        : "",
    );
    tanggalInput.setCustomValidity(
      tglVal && tglVal < tanggalInput.min ? "Tanggal tidak boleh lampau" : "",
    );

    if (!bookingForm.checkValidity()) {
      bookingForm.classList.add("was-validated");
      bookingForm.reportValidity();
      return;
    }

    document.getElementById("isiRingkasan").innerHTML = `
      <p><b>Nama:</b> ${document.getElementById("nama").value}</p>
      <p><b>No. HP:</b> ${document.getElementById("hp").value}</p>
      <p><b>Tanggal:</b> ${tanggalInput.value}</p>
      <p><b>Jam:</b> ${jamInput.value}</p>
      <p><b>Durasi:</b> ${durasiInput.value} jam</p>
      <p>${totalHargaEl.textContent}</p>
    `;
    new bootstrap.Modal(document.getElementById("modalRingkasan")).show();
  });
}

if (btnKonfirmasi) {
  btnKonfirmasi.addEventListener("click", () => {
    bootstrap.Modal.getInstance(
      document.getElementById("modalRingkasan"),
    ).hide();

    const modalElement = document.getElementById("confirmModal");
    if (modalElement) {
      new bootstrap.Modal(modalElement).show();
    }

    bookingForm.reset();
    bookingForm.classList.remove("was-validated");
    totalHargaEl.textContent = "Total Harga: Rp0";
  });
}

// Blok 3: Data Jadwal Booking Multi-Tanggal (Async)
function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}

function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Pola slot terisi per hari-dalam-minggu (0=Minggu ... 6=Sabtu), dibuat statis
// agar simulasi ketersediaan terasa nyata untuk 7 hari ke depan.
const polaSlotMingguan = [
  [
    { jam: "07:00", durasi: 2 },
    { jam: "19:00", durasi: 2 },
  ], // Minggu
  [
    { jam: "08:00", durasi: 1 },
    { jam: "19:00", durasi: 2 },
  ], // Senin
  [
    { jam: "07:00", durasi: 1 },
    { jam: "16:00", durasi: 1 },
    { jam: "20:00", durasi: 1 },
  ], // Selasa
  [{ jam: "09:00", durasi: 1 }], // Rabu
  [
    { jam: "17:00", durasi: 2 },
    { jam: "21:00", durasi: 1 },
  ], // Kamis
  [
    { jam: "06:00", durasi: 1 },
    { jam: "18:00", durasi: 3 },
  ], // Jumat
  [
    { jam: "15:00", durasi: 1 },
    { jam: "16:00", durasi: 1 },
    { jam: "22:00", durasi: 1 },
  ], // Sabtu
];

const namaSample = ["Andi", "Budi", "Citra", "Dewi", "Eka", "Farhan", "Gita"];

const bookingData = {};
(function buatBookingData() {
  const hariIni = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(hariIni);
    d.setDate(hariIni.getDate() + i);
    const pola = polaSlotMingguan[d.getDay()];
    bookingData[toDateStr(d)] = pola.map((slot, idx) => ({
      ...slot,
      nama: namaSample[(i + idx) % namaSample.length],
    }));
  }
})();

function jamRangeSesi(sesi) {
  if (sesi === "pagi") return [6, 7, 8, 9];
  if (sesi === "sore") return [15, 16, 17];
  if (sesi === "malam") return [18, 19, 20, 21, 22];
  return [];
}

function cekKetersediaan(tanggal, sesi) {
  const jamList = jamRangeSesi(sesi);
  const terisiJam = new Set();
  (bookingData[tanggal] || []).forEach((item) => {
    const startH = parseInt(item.jam.split(":")[0]);
    for (let h = startH; h < startH + item.durasi; h++) terisiJam.add(h);
  });
  return jamList.map((h) => ({
    jam: `${pad(h)}:00 - ${pad(h + 1)}:00`,
    status: terisiJam.has(h) ? "terisi" : "kosong",
  }));
}

// Navigasi tanggal untuk daftar "Jadwal Terisi" di halaman booking
let tanggalAktifJadwal = new Date();

function formatTanggalLabel(d) {
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function renderJadwalTerisi() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const listEl = document.getElementById("listBooking");
      const labelEl = document.getElementById("labelTanggalJadwal");
      if (!listEl) return resolve();

      const key = toDateStr(tanggalAktifJadwal);
      if (labelEl) labelEl.textContent = formatTanggalLabel(tanggalAktifJadwal);

      const data = bookingData[key] || [];
      listEl.innerHTML = "";

      if (data.length === 0) {
        listEl.innerHTML = `<li class="list-group-item text-center text-muted"><i class="bi bi-calendar-x"></i> Belum ada jadwal terisi</li>`;
        return resolve();
      }

      data.forEach((item) => {
        const startH = parseInt(item.jam.split(":")[0]);
        const endH = startH + item.durasi;
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.innerHTML = `<i class="bi bi-clock-history me-1"></i> ${pad(startH)}:00 - ${pad(endH)}:00 - ${item.nama} <span class="badge bg-danger float-end">Terisi</span>`;
        listEl.appendChild(li);
      });

      resolve();
    }, 250);
  });
}

const btnJadwalPrev = document.getElementById("jadwalPrev");
const btnJadwalNext = document.getElementById("jadwalNext");

if (btnJadwalPrev) {
  btnJadwalPrev.addEventListener("click", () => {
    tanggalAktifJadwal.setDate(tanggalAktifJadwal.getDate() - 1);
    renderJadwalTerisi();
  });
}
if (btnJadwalNext) {
  btnJadwalNext.addEventListener("click", () => {
    tanggalAktifJadwal.setDate(tanggalAktifJadwal.getDate() + 1);
    renderJadwalTerisi();
  });
}
if (document.getElementById("listBooking")) {
  renderJadwalTerisi();
}

// Blok 4: Bookmark Fasilitas (LocalStorage)
document.querySelectorAll(".btn-bookmark").forEach((btn) => {
  const id = btn.dataset.id;
  const saved = JSON.parse(localStorage.getItem("bookmarks") || "[]");
  const icon = btn.querySelector("i");

  if (saved.includes(id)) {
    icon.classList.replace("bi-bookmark", "bi-bookmark-fill");
  }

  btn.addEventListener("click", () => {
    let bm = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    if (bm.includes(id)) {
      bm = bm.filter((x) => x !== id);
      icon.classList.replace("bi-bookmark-fill", "bi-bookmark");
    } else {
      bm.push(id);
      icon.classList.replace("bi-bookmark", "bi-bookmark-fill");
    }
    localStorage.setItem("bookmarks", JSON.stringify(bm));
  });
});

// Blok 5: Scroll to Top
const btnTop = document.getElementById("scrollTop");
if (btnTop) {
  window.addEventListener("scroll", () => {
    btnTop.classList.toggle("d-none", window.scrollY < 300);
  });
  btnTop.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
}

// Blok 6: Slider generic (tombol panah kiri/kanan, thumbnail, counter)
function initSlider(root) {
  const items = root.querySelectorAll(".slide-item");
  const prevBtn = root.querySelector(".slide-prev");
  const nextBtn = root.querySelector(".slide-next");
  const thumbs = root.querySelectorAll(".gallery-thumb");
  const counter = root.querySelector(".slide-counter-current");
  if (!items.length) return;

  let current = 0;

  function render() {
    items.forEach((item, i) => item.classList.toggle("active", i === current));
    thumbs.forEach((thumb, i) =>
      thumb.classList.toggle("active", i === current),
    );
    if (counter) counter.textContent = String(current + 1).padStart(2, "0");
    if (prevBtn) prevBtn.classList.toggle("active", current !== 0);
    if (nextBtn)
      nextBtn.classList.toggle("active", current !== items.length - 1);
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      current = current === 0 ? items.length - 1 : current - 1;
      render();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      current = current === items.length - 1 ? 0 : current + 1;
      render();
    });
  }

  thumbs.forEach((thumb, i) => {
    thumb.addEventListener("click", () => {
      current = i;
      render();
    });
  });

  render();
}

document.querySelectorAll("[data-slider]").forEach(initSlider);

// Blok 7: Efek Timbul Saat Scroll (Scroll Reveal)
(function initScrollReveal() {
  const targets = document.querySelectorAll(
    "section:not(.hero-section), .field-card, .feature-card, .feature-card-white, .testimonial-card, .cta-section, .play-card, .satisfaction-card, .card",
  );
  if (!targets.length || !("IntersectionObserver" in window)) return;

  targets.forEach((el) => el.classList.add("reveal"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-active");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  targets.forEach((el) => observer.observe(el));
})();

// Blok 8: Cek Ketersediaan Cepat (index.html)
const btnCekKetersediaan = document.getElementById("btnCekKetersediaan");
if (btnCekKetersediaan) {
  btnCekKetersediaan.addEventListener("click", (e) => {
    e.preventDefault();

    const tglVal = document.getElementById("quickTanggal").value;
    const sesiVal = document.getElementById("quickSesi").value;

    if (!tglVal) {
      alert("Pilih tanggal terlebih dahulu.");
      return;
    }

    const overlay = document.getElementById("loadingCekJadwal");
    if (overlay) overlay.classList.remove("d-none");

    setTimeout(() => {
      if (overlay) overlay.classList.add("d-none");

      const hasil = cekKetersediaan(tglVal, sesiVal);
      const isiEl = document.getElementById("isiKetersediaan");
      const tglLabel = formatTanggalLabel(new Date(tglVal + "T00:00:00"));
      const sesiLabel = sesiVal.charAt(0).toUpperCase() + sesiVal.slice(1);

      let html = `<p class="mb-1"><b>Tanggal:</b> ${tglLabel}</p><p><b>Sesi:</b> ${sesiLabel}</p><ul class="list-group">`;
      hasil.forEach((h) => {
        const badge = h.status === "kosong" ? "bg-success" : "bg-danger";
        const teks = h.status === "kosong" ? "Kosong" : "Terisi";
        html += `<li class="list-group-item d-flex justify-content-between align-items-center">${h.jam}<span class="badge ${badge}">${teks}</span></li>`;
      });
      html += `</ul>`;

      isiEl.innerHTML = html;
      new bootstrap.Modal(document.getElementById("modalKetersediaan")).show();
    }, 700);
  });
}
