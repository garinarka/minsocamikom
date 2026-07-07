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

  const hargaPerJam = weekend ? hargaTabel[sesi].weekend : hargaTabel[sesi].weekday;
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

    jamInput.setCustomValidity(jamVal && !getSesi(jamVal) ? "Jam di luar operasional (06-10, 15-18, 18-23)" : "");
    tanggalInput.setCustomValidity(tglVal && tglVal < tanggalInput.min ? "Tanggal tidak boleh lampau" : "");

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
    bootstrap.Modal.getInstance(document.getElementById("modalRingkasan")).hide();

    const modalElement = document.getElementById("confirmModal");
    if (modalElement) {
      new bootstrap.Modal(modalElement).show();
    }

    bookingForm.reset();
    bookingForm.classList.remove("was-validated");
    totalHargaEl.textContent = "Total Harga: Rp0";
  });
}

// Blok 3: Data Jadwal Booking (Async)
const jadwalTerisi = [
  {
    nama: "Andi",
    jam: "08.00 - 09.00",
  },
  {
    nama: "Budi",
    jam: "16.00 - 17.00",
  },
  {
    nama: "Citra",
    jam: "19.00 - 20.00",
  },
];

function tampilkanJadwal() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const listEl = document.getElementById("listBooking");

      if (!listEl) {
        resolve();
        return;
      }

      listEl.innerHTML = "";

      if (jadwalTerisi.length === 0) {
        listEl.innerHTML = `<li class="list-group-item text-center text-muted"><i class="bi bi-calendar-x"></i> Belum ada jadwal terisi</li>`;
        resolve();
        return;
      }

      jadwalTerisi.forEach((item) => {
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.innerHTML = `<i class="bi bi-clock-history me-1"></i> ${item.jam} - ${item.nama} <span class="badge bg-danger float-end">Terisi</span>`;
        listEl.appendChild(li);
      });

      resolve();
    }, 300);
  });
}

if (document.getElementById("listBooking")) {
  tampilkanJadwal();
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
  btnTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}
