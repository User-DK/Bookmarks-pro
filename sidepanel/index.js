import DOMPurify from "dompurify";
import { dbInstance } from "../lib/db";
import { summarizeAndRewrite } from "../lib/summ_rewrite";
import { extractPageContent, getPageSelection } from "../lib/extraction";

// bookmarks IndexDB instance
const db = dbInstance;
await db.init();

// Navigation
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".nav-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".page")
      .forEach((p) => p.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(`${btn.dataset.page}-page`).classList.add("active");
    if (btn.dataset.page === "bookmarks") {
      updateBookmarksList();
    }
  });
});

// Generate Summary
document
  .getElementById("generate-summary")
  .addEventListener("click", async () => {
    const type = document.getElementById("summary-type").value;
    const length = document.getElementById("summary-length").value;
    const role = document.getElementById("summary-role").value;
    const context = document.getElementById("summary-context").value;
    const contenttype = document.getElementById("summary-content").value;
    const tone = document.getElementById("summary-tone").value;

    const loadingSpinner = document.getElementById("loading-spinner");
    loadingSpinner.style.display = "block"; // Show loading spinner

    try {
      const { content, url, title, favIconUrl } =
        contenttype === "selected-text"
          ? await getPageSelection()
          : await extractPageContent();
      if (content === "") {
        console.error("No text selected. Please select some text to summarize.");
        return;
      }
      const summarizerOptions = {
        type: type,
        format: "plain-text",
        length: length,
      };
      const rewriterOptions = {
        tone: tone,
        format: "plain-text",
        length: "as-is",
      };
      const maxCharLimit = 4000;

      const summary = await summarizeAndRewrite(
        content,
        summarizerOptions,
        rewriterOptions,
        maxCharLimit,
        role,
        context
      );

      let sanitizedSummary = DOMPurify.sanitize(summary);

      const summaryContainer = document.getElementById("summary-res");
      summaryContainer.value = sanitizedSummary;

      document.getElementById("add-bookmark").onclick = async () => {
        const editedSummary = summaryContainer.value;
        if (!editedSummary) {
          const notaddbookmark = document.getElementById("bookmark-not-added");
          notaddbookmark.style.display = "block";
          setTimeout(() => {
            notaddbookmark.style.display = "none";
          }, 3000);
          return;
        }

        try {
          await db.addBookmark({
            url,
            title,
            summary: editedSummary,
            timestamp: new Date().toISOString(),
            favIconUrl: favIconUrl,
          });
          const addbookmark = document.getElementById("bookmark-added");
          addbookmark.style.display = "block";
          setTimeout(() => {
            addbookmark.style.display = "none";
          }, 3000);
        }
        catch (error) {
          console.error(`Error adding bookmark: ${error}`);
        }
        updateBookmarksList();
      };
    } catch (error) {
      console.error(`Error generating summary: ${error}`);
    }
    finally {
      loadingSpinner.style.display = "none"; // Hide loading spinner
    }
  });


document.getElementById("search-button").addEventListener("click", async () => {
  const query = document.getElementById("search-bookmarks").value.trim();
  if (query) {
    const bookmarks = await db.findBookmarksByUrlOrTitle(query);
    updateBookmarksList(bookmarks);
  } else {
    updateBookmarksList(await db.getBookmarks());
  }
});

function truncateText(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + "...";
}

async function updateBookmarksList(bookmarks = null) {
  if (!bookmarks) {
    bookmarks = await db.getBookmarks();
  }
  // const bookmarks = await db.getBookmarks();
  const container = document.getElementById("bookmarks-list");
  container.innerHTML = "";

  bookmarks.reverse().forEach((bookmark) => {
    const div = document.createElement("div");
    div.className = "bookmark-item";

    const truncatedTitle = truncateText(bookmark.title, 30);

    const faviconHtml = bookmark.favIconUrl
      ? `<img src="${bookmark.favIconUrl}" alt="Favicon" class="favicon" />`
      : `<i class="fa-solid fa-globe fa-xl"></i>`;

    div.innerHTML = `
      <div class="bookmark-header">
        ${faviconHtml}
        <a href="${bookmark.url
      }" target="_blank" class="bookmark-title" data-full-title="${bookmark.title
      }  style="font-size:1.5rem"">
            ${truncatedTitle}
          </a>
      </div>
      <p style="margin-top: 0.4rem;">${bookmark.summary}</p>
      <div class="timestamp-container">
      <small>${new Date(bookmark.timestamp).toLocaleString()}</small>
      </div>
      <button class="delete-bookmark" data-id="${bookmark.id}"><i class="fa-solid fa-trash fa-sm" style="color: #ffffff;margin-right:3px"></i>Delete</button>
    `;
    container.appendChild(div);
  });


  document.querySelectorAll(".delete-bookmark").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      try {
        await db.deleteBookmark(id);
        updateBookmarksList();
      } catch (error) {
        console.error("Failed to delete bookmark:", error);
      }
    });
  });

  document.querySelectorAll(".bookmark-title").forEach((titleElement) => {
    const truncatedTitle = titleElement.textContent;
    const fullTitle = titleElement.getAttribute("data-full-title");

    titleElement.addEventListener("mouseenter", () => {
      titleElement.textContent = fullTitle;
    });

    titleElement.addEventListener("mouseleave", () => {
      titleElement.textContent = truncatedTitle;
    });
  });
}

document
  .getElementById("export-bookmarks")
  .addEventListener("click", async () => {
    const url = await db.exportBookmarks();
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookmarks.json";
    a.click();
  });

document.getElementById("import-bookmarks").addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      await db.importBookmarks(event.target.result);
      updateBookmarksList();
    };

    reader.readAsText(file);
  };

  input.click();
});
