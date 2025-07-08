// idb-utility.js

// Konstanta nama database, versi database, dan nama object store
const DB_NAME = "gameverse_db";
const DB_VERSION = 1;
const STORE_NAME = "favorite_games";

let db; // Variabel untuk menyimpan instance database

// Fungsi untuk membuka atau membuat database IndexedDB
async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION); // Buka koneksi IndexedDB

    // Event saat database baru dibuat atau versi diperbarui
    request.onupgradeneeded = (event) => {
      db = event.target.result;
      // Kalau object store belum ada, buat baru
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" }); // Pakai 'id' sebagai primary key
      }
    };

    // Event kalau database berhasil dibuka
    request.onsuccess = (event) => {
      db = event.target.result; // Simpan referensi database
      resolve(db); // Selesaikan promise
    };

    // Event kalau gagal buka database
    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };
  });
}

// Fungsi untuk menambahkan game ke favorit
async function addFavoriteGame(game) {
  if (!db) db = await openDatabase(); // Pastikan database sudah dibuka
  const transaction = db.transaction(STORE_NAME, "readwrite"); // Buka transaksi readwrite
  const store = transaction.objectStore(STORE_NAME); // Ambil object store
  return new Promise((resolve, reject) => {
    const request = store.add(game); // Tambahkan data game
    request.onsuccess = () => resolve(); // Sukses
    request.onerror = () => reject(request.error); // Error
  });
}

// Fungsi untuk mengambil 1 game favorit berdasarkan ID
async function getFavoriteGame(id) {
  if (!db) db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readonly"); // Transaksi hanya baca
  const store = transaction.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const request = store.get(id); // Ambil data sesuai id
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Fungsi untuk mengambil semua game favorit
async function getAllFavoriteGames() {
  if (!db) db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const request = store.getAll(); // Ambil semua data
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Fungsi untuk menghapus game dari favorit berdasarkan ID
async function removeFavoriteGame(id) {
  if (!db) db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const request = store.delete(id); // Hapus data sesuai id
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Fungsi untuk cek apakah sebuah game sudah difavoritkan atau belum
async function isGameFavorited(id) {
  const game = await getFavoriteGame(id); // Ambil data game
  return !!game; // Kalau ada datanya, return true, kalau nggak ada return false
}

// Langsung buka database saat file di-load, untuk inisialisasi awal
openDatabase().catch((err) => console.error("Failed to open IndexedDB:", err));
