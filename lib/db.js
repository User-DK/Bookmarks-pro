// const DB_NAME = 'smart-bookmarks';
// const DB_VERSION = 1;

// class BookmarkDB {
//   constructor() {
//     this.db = null;
//   }

//   async init() {
//     return new Promise((resolve, reject) => {
//       const request = indexedDB.open(DB_NAME, DB_VERSION);

//       request.onerror = () => reject(request.error);
//       request.onsuccess = () => {
//         this.db = request.result;
//         resolve();
//       };

//       request.onupgradeneeded = (event) => {
//         const db = event.target.result;
//         if (!db.objectStoreNames.contains('bookmarks')) {
//           const store = db.createObjectStore('bookmarks', { keyPath: 'id', autoIncrement: true });
//           store.createIndex('url', 'url', { unique: true }); // Index for quick lookup by URL
//           store.createIndex('timestamp', 'timestamp'); // Index for sorting by timestamp
//         }
//       };
//     });
//   }

//   async addBookmark({ url, summary, title }) {
//     const timestamp = new Date().toISOString(); // Ensure consistent format for timestamps
//     const bookmark = { url, summary, title, timestamp };

//     return new Promise((resolve, reject) => {
//       const tx = this.db.transaction('bookmarks', 'readwrite');
//       const store = tx.objectStore('bookmarks');
//       const request = store.add(bookmark);

//       request.onsuccess = () => resolve(request.result);
//       request.onerror = () => reject(request.error);
//     });
//   }

//   async getBookmarks() {
//     return new Promise((resolve, reject) => {
//       const tx = this.db.transaction('bookmarks', 'readonly');
//       const store = tx.objectStore('bookmarks');
//       const request = store.getAll();

//       request.onsuccess = () => {
//         const bookmarks = request.result.map((bookmark) => ({
//           ...bookmark,
//           timestamp: new Date(bookmark.timestamp), // Convert timestamp back to Date object
//         }));
//         resolve(bookmarks);
//       };
//       request.onerror = () => reject(request.error);
//     });
//   }

//   async exportBookmarks() {
//     const bookmarks = await this.getBookmarks();
//     const blob = new Blob([JSON.stringify(bookmarks)], { type: 'application/json' });
//     return URL.createObjectURL(blob);
//   }

//   async importBookmarks(jsonData) {
//     const bookmarks = JSON.parse(jsonData);

//     for (const bookmark of bookmarks) {
//       try {
//         await this.addBookmark(bookmark);
//       } catch (e) {
//         console.error('Failed to import bookmark:', bookmark, e);
//       }
//     }
//   }

//   async deleteBookmark(id) {
//     return new Promise((resolve, reject) => {
//       const tx = this.db.transaction('bookmarks', 'readwrite');
//       const store = tx.objectStore('bookmarks');
//       const request = store.delete(id);

//       request.onsuccess = () => resolve();
//       request.onerror = () => reject(request.error);
//     });
//   }

//   async findBookmarkByUrl(url) {
//     return new Promise((resolve, reject) => {
//       const tx = this.db.transaction('bookmarks', 'readonly');
//       const store = tx.objectStore('bookmarks');
//       const index = store.index('url');
//       const request = index.get(url);

//       request.onsuccess = () => resolve(request.result);
//       request.onerror = () => reject(request.error);
//     });
//   }
// }


// const dbInstance = new BookmarkDB();

// export { dbInstance, BookmarkDB };



const DB_NAME = 'smart-bookmarks';
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
        if (!db.objectStoreNames.contains('bookmarks')) {
          const store = db.createObjectStore('bookmarks', { keyPath: 'id', autoIncrement: true });
          store.createIndex('url', 'url', { unique: true }); // Index for quick lookup by URL
          store.createIndex('timestamp', 'timestamp'); // Index for sorting by timestamp
        }
      };
    });
  }

  async addBookmark({ url, summary, title, faviconUrl }) {
    const timestamp = new Date().toISOString(); // Ensure consistent format for timestamps
    const favicon = await this.getFavicon(faviconUrl); // Fetch favicon from the URL
    const bookmark = { url, summary, title, timestamp, favicon };

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('bookmarks', 'readwrite');
      const store = tx.objectStore('bookmarks');
      const request = store.add(bookmark);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getBookmarks() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('bookmarks', 'readonly');
      const store = tx.objectStore('bookmarks');
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
    const blob = new Blob([JSON.stringify(bookmarks)], { type: 'application/json' });
    return URL.createObjectURL(blob);
  }

  async importBookmarks(jsonData) {
    const bookmarks = JSON.parse(jsonData);

    for (const bookmark of bookmarks) {
      try {
        await this.addBookmark(bookmark);
      } catch (e) {
        console.error('Failed to import bookmark:', bookmark, e);
      }
    }
  }

  async deleteBookmark(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('bookmarks', 'readwrite');
      const store = tx.objectStore('bookmarks');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async findBookmarkByUrl(url) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('bookmarks', 'readonly');
      const store = tx.objectStore('bookmarks');
      const index = store.index('url');
      const request = index.get(url);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Helper function to fetch the favicon from the URL
  async getFavicon(faviconUrl) {
    // const faviconUrl = `${new URL(url).origin}/favicon.ico`;

    // Fetch the favicon and convert it to a base64 string
    try {
      const response = await fetch(faviconUrl);
      if (!response.ok) throw new Error('Favicon not found');

      const blob = await response.blob();
      return await this.blobToBase64(blob); // Convert to base64
    } catch (e) {
      console.error('Failed to retrieve favicon:', e);
      return faviconUrl; // If favicon fetching fails, return null
    }
  }

  // Helper function to convert a Blob to a Base64 string
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]); // Remove the 'data:image/x' part of the URL
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

const dbInstance = new BookmarkDB();

export { dbInstance, BookmarkDB };
