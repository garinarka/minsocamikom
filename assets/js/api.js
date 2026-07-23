// Konfigurasi & wrapper API backend Minisoccer Amikom
const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000/api"
  : "https://api-minsocamikom.onrender.com/api"; // ganti sesuai domain backend production

const Auth = {
  getToken: () => localStorage.getItem("msa_token"),
  getUser: () => JSON.parse(localStorage.getItem("msa_user") || "null"),
  setSession: (token, user) => {
    localStorage.setItem("msa_token", token);
    localStorage.setItem("msa_user", JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem("msa_token");
    localStorage.removeItem("msa_user");
  },
  isLoggedIn: () => !!localStorage.getItem("msa_token"),
};

async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = Auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || data.errors?.[0]?.msg || "Terjadi kesalahan pada server");
  }
  return data;
}

// Redirect ke login jika halaman butuh autentikasi
function requireAuth(allowedRoles = []) {
  const user = Auth.getUser();
  if (!Auth.isLoggedIn() || !user) {
    window.location.href = "login.html";
    return null;
  }
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    alert("Anda tidak memiliki akses ke halaman ini");
    window.location.href = "index.html";
    return null;
  }
  return user;
}
