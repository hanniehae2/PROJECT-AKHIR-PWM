// Register Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .then((reg) => console.log("Service Worker Registered", reg))
    .catch((err) => console.error("Service Worker Registration Failed", err));
}

const gameListElement = document.getElementById("gameList");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const loadingMessage = document.getElementById("loadingMessage");
const offlineMessage = document.getElementById("offlineMessage");
const errorMessage = document.getElementById("errorMessage");
const noResultsMessage = document.getElementById("noResultsMessage");

const API_URL = "https://proxy-server-production-14c6.up.railway.app/api/games";

async function fetchAndRenderGames(query = "") {
  loadingMessage.style.display = "block";
  offlineMessage.style.display = "none";
  errorMessage.style.display = "none";
  noResultsMessage.style.display = "none";
  gameListElement.innerHTML = ""; // Clear previous games

  let games = [];
  let isOffline = false;

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    games = await response.json();
  } catch (error) {
    console.warn("Network fetch failed for games, trying cache:", error);
    isOffline = true;
    offlineMessage.style.display = "block";

    // Fallback to cache API
    try {
      const cachedResponse = await caches.match(API_URL);
      if (cachedResponse) {
        games = await cachedResponse.json();
      } else {
        errorMessage.style.display = "block"; // Show error if no cache either
        loadingMessage.style.display = "none";
        return;
      }
    } catch (cacheError) {
      console.error("Failed to retrieve from cache:", cacheError);
      errorMessage.style.display = "block"; // Show error if cache fails
      loadingMessage.style.display = "none";
      return;
    }
  } finally {
    loadingMessage.style.display = "none";
  }

  const filteredGames = games.filter(
    (game) =>
      game.title.toLowerCase().includes(query.toLowerCase()) ||
      game.short_description.toLowerCase().includes(query.toLowerCase()) ||
      game.genre.toLowerCase().includes(query.toLowerCase()) ||
      game.platform.toLowerCase().includes(query.toLowerCase())
  );

  if (filteredGames.length === 0) {
    noResultsMessage.style.display = "block";
  } else {
    renderGames(filteredGames);
  }
}

function renderGames(games) {
  gameListElement.innerHTML = ""; // Clear existing content before rendering
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
    // Navigate to detail page on card click
    gameCard.addEventListener("click", () => {
      window.location.href = `detail.html?id=${game.id}`;
    });
    gameListElement.appendChild(gameCard);
  });
}

// Initial fetch on page load
document.addEventListener("DOMContentLoaded", () => {
  // Only fetch games for index.html
  if (
    window.location.pathname === "/" ||
    window.location.pathname.includes("index.html")
  ) {
    fetchAndRenderGames();
  }
});

// Search functionality
searchButton.addEventListener("click", () => {
  fetchAndRenderGames(searchInput.value);
});

searchInput.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    fetchAndRenderGames(searchInput.value);
  }
});
