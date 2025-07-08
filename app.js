// Daftar Service Worker biar website bisa kerja offline atau lebih cepet karena caching
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .then((reg) => console.log("Service Worker Registered", reg)) // sukses daftar SW
    .catch((err) => console.error("Service Worker Registration Failed", err)); // gagal daftar SW
}

// Ambil elemen-elemen dari HTML biar bisa dipakai di JS
const gameListElement = document.getElementById("gameList");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const loadingMessage = document.getElementById("loadingMessage");
const offlineMessage = document.getElementById("offlineMessage");
const errorMessage = document.getElementById("errorMessage");
const noResultsMessage = document.getElementById("noResultsMessage");

// Ini URL API tempat ambil data list game
const API_URL = "https://proxy-server-production-14c6.up.railway.app/api/games";

// Fungsi utama buat ambil data game dan nampilin ke halaman
async function fetchAndRenderGames(query = "") {
  // Tampilkan loading, hilangkan pesan error / offline dulu
  loadingMessage.style.display = "block";
  offlineMessage.style.display = "none";
  errorMessage.style.display = "none";
  noResultsMessage.style.display = "none";
  gameListElement.innerHTML = ""; // Kosongin daftar game sebelumnya

  let games = [];
  let isOffline = false;

  try {
    // Coba ambil data game dari API
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    games = await response.json(); // Ubah response jadi data JSON
  } catch (error) {
    console.warn("Gagal ambil data dari internet, coba ambil dari cache:", error);
    isOffline = true;
    offlineMessage.style.display = "block";

    // Kalau fetch gagal, coba ambil data dari cache
    try {
      const cachedResponse = await caches.match(API_URL);
      if (cachedResponse) {
        games = await cachedResponse.json();
      } else {
        // Kalau cache juga kosong, tampilkan error
        errorMessage.style.display = "block";
        loadingMessage.style.display = "none";
        return;
      }
    } catch (cacheError) {
      console.error("Gagal ambil data dari cache:", cacheError);
      errorMessage.style.display = "block";
      loadingMessage.style.display = "none";
      return;
    }
  } finally {
    loadingMessage.style.display = "none"; // Selesai loading
  }

  // Filter game sesuai kata kunci pencarian (judul, deskripsi, genre, platform)
  const filteredGames = games.filter(
    (game) =>
      game.title.toLowerCase().includes(query.toLowerCase()) ||
      game.short_description.toLowerCase().includes(query.toLowerCase()) ||
      game.genre.toLowerCase().includes(query.toLowerCase()) ||
      game.platform.toLowerCase().includes(query.toLowerCase())
  );

  if (filteredGames.length === 0) {
    noResultsMessage.style.display = "block"; // Kalau nggak ada hasil, tampilkan pesan "nggak ketemu"
  } else {
    renderGames(filteredGames); // Tampilkan hasilnya ke halaman
  }
}

// Buat nampilin game-game ke halaman
function renderGames(games) {
  gameListElement.innerHTML = ""; // Bersihin dulu list sebelumnya
  games.forEach((game) => {
    const gameCard = document.createElement("div");
    gameCard.classList.add("game-card");
    gameCard.innerHTML = `
            <img src="${game.thumbnail}" alt="${game.title}">
            <div class="card-content">
                <h3>${game.title}</h3>
                <p>${game.short_description}</p>
                <div class="details">
                    <span>Genre: ${game.genre}</span>
                    <span>Platform: ${game.platform}</span>
                </div>
            </div>
        `;
    // Kalau game-nya diklik, pindah ke halaman detail game
    gameCard.addEventListener("click", () => {
      window.location.href = `detail.html?id=${game.id}`;
    });
    gameListElement.appendChild(gameCard);
  });
}

// Pas halaman dibuka pertama kali, langsung ambil data game
document.addEventListener("DOMContentLoaded", () => {
  // Pastikan ini cuma jalan di halaman index
  if (
    window.location.pathname === "/" ||
    window.location.pathname.includes("index.html")
  ) {
    fetchAndRenderGames();
  }
});

// Fitur pencarian: klik tombol atau tekan Enter buat cari game
searchButton.addEventListener("click", () => {
  fetchAndRenderGames(searchInput.value);
});

searchInput.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    fetchAndRenderGames(searchInput.value);
  }
});
