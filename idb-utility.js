// idb-utility.js

const DB_NAME = "gameverse_db";
const DB_VERSION = 1;
const STORE_NAME = "favorite_games";

let db;

// Function to open/create the IndexedDB database
async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };
  });
}

// Function to add a game to favorites
async function addFavoriteGame(game) {
  if (!db) db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const request = store.add(game);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Function to get a single favorite game by ID
async function getFavoriteGame(id) {
  if (!db) db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Function to get all favorite games
async function getAllFavoriteGames() {
  if (!db) db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Function to remove a game from favorites
async function removeFavoriteGame(id) {
  if (!db) db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Function to check if a game is favorited
async function isGameFavorited(id) {
  const game = await getFavoriteGame(id);
  return !!game; // Returns true if game exists, false otherwise
}

// Ensure database is opened when utility is loaded
openDatabase().catch((err) => console.error("Failed to open IndexedDB:", err));
