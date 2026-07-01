// Blok 1: Kalkulator Harga Otomatis
const hargaPerJam = 100000;

const jamInput = document.getElementById("jam");
const durasiInput = document.getElementById("durasi");
const totalHargaEl = document.getElementById("totalHarga");

function hitungTotal() {
  if (!durasiInput || !totalHargaEl) return;

  const durasi = parseInt(durasiInput.value) || 0;
  const total = durasi * hargaPerJam;

  totalHargaEl.textContent = "Total Harga: Rp" + total.toLocaleString("id-ID");
}

if (durasiInput) {
  durasiInput.addEventListener("change", hitungTotal);
}

// Blok 2: Validasi Form & Modal
const bookingForm = document.getElementById("bookingForm");

if (bookingForm) {
  bookingForm.addEventListener("submit", function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (!bookingForm.checkValidity()) {
      bookingForm.classList.add("was-validated");
      return;
    }

    const modalElement = document.getElementById("confirmModal");

    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }

    bookingForm.reset();
    bookingForm.classList.remove("was-validated");

    if (totalHargaEl) {
      totalHargaEl.textContent = "Total Harga: Rp0";
    }
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

      // Hindari data dobel
      listEl.innerHTML = "";

      jadwalTerisi.forEach((item) => {
        const li = document.createElement("li");

        li.className = "list-group-item";
        li.textContent = `${item.jam} - ${item.nama}`;

        listEl.appendChild(li);
      });

      resolve();
    }, 300);
  });
}

if (document.getElementById("listBooking")) {
  tampilkanJadwal();
}
