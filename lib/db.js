const DB_NAME = "bookmarks-pro";
const DB_VERSION = 1;

class BookmarkDB {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("bookmarks")) {
          const store = db.createObjectStore("bookmarks", {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("url", "url", { unique: false }); // Index for quick lookup by URL
          store.createIndex("timestamp", "timestamp"); // Index for sorting by timestamp
          store.createIndex("title", "title", { unique: false });
        }
      };
    });
  }

  async addBookmark({ url, summary, title, favIconUrl }) {
    const timestamp = new Date().toISOString(); // Ensure consistent format for timestamps

    const bookmark = { url, summary, title, timestamp, favIconUrl };

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("bookmarks", "readwrite");
      const store = tx.objectStore("bookmarks");
      const request = store.add(bookmark);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getBookmarks() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("bookmarks", "readonly");
      const store = tx.objectStore("bookmarks");
      const request = store.getAll();

      request.onsuccess = () => {
        const bookmarks = request.result.map((bookmark) => ({
          ...bookmark,
          timestamp: new Date(bookmark.timestamp), // Convert timestamp back to Date object
        }));
        resolve(bookmarks);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async exportBookmarks() {
    const bookmarks = await this.getBookmarks();
    const blob = new Blob([JSON.stringify(bookmarks)], {
      type: "application/json",
    });
    return URL.createObjectURL(blob);
  }

  async importBookmarks(jsonData) {
    const bookmarks = JSON.parse(jsonData);

    for (const bookmark of bookmarks) {
      try {
        await this.addBookmark(bookmark);
      } catch (e) {
        console.error("Failed to import bookmark:", bookmark, e);
      }
    }
  }

  async deleteBookmark(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("bookmarks", "readwrite");
      const store = tx.objectStore("bookmarks");
      const request = store.delete(Number(id)); // Ensure id is a number

      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  async findBookmarksByUrlOrTitle(query) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("bookmarks", "readonly");
      const store = tx.objectStore("bookmarks");

      let request;

      if (query.includes("://")) {
        const index = store.index("url");
        request = index.getAll(IDBKeyRange.only(query));
      } else {
        const index = store.index("title");
        request = index.openCursor();
      }

      const bookmarks = [];
      const lowerCaseQuery = query.toLowerCase();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const title = cursor.value.title.toLowerCase();
          const summary = cursor.value.summary.toLowerCase();
          if (title.includes(lowerCaseQuery) || summary.includes(lowerCaseQuery)) {
            bookmarks.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve(bookmarks);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

const dbInstance = new BookmarkDB();

export { dbInstance, BookmarkDB };
