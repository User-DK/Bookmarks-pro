import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { dbInstance } from '../lib/db';
import { summarizeAndRewrite } from '../lib/summ_rewrite';
import { extractPageContent, getPageSelection } from '../lib/extraction'

// bookmarks IndexDB instance
const db = dbInstance;
await db.init();

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(`${btn.dataset.page}-page`).classList.add('active');
  });
});

// Generate Summary
document.getElementById('generate-summary').addEventListener('click', async () => {
  const type = document.getElementById('summary-type').value
  const length = document.getElementById('summary-length').value
  const role = document.getElementById('summary-role').value
  const context = document.getElementById('summary-context').value
  const contenttype = document.getElementById('summary-content').value
  const tone = document.getElementById('summary-tone').value

  try {
    let { content, url, title, favIcon } = contenttype === 'selected-text' ? await getPageSelection() : await extractPageContent();
    console.log("Extracted content:", content);
    // console.log("Options:", options);
    console.log("URL:", url);
    console.log("Title:", title);
    if (content === '') {
      alert("No text selected. Please select some text to summarize.");
      return;
    }
    // text,
    //   summarizerOptions = { type: "key-points", length: "long" },
    // const  rewriterOptions = { tone: "developer", format: "plain", length: "concise" },
    // enum AISummarizerType { "tl;dr", "key-points", "teaser", "headline" };
    // enum AISummarizerFormat { "plain-text", "markdown" };
    // enum AISummarizerLength { "short", "medium", "long" };
    // enum AIRewriterTone { "as-is", "more-formal", "more-casual" };
    // enum AIRewriterFormat { "as-is", "plain-text", "markdown" };
    // enum AIRewriterLength { "as-is", "shorter", "longer" };
    const summarizerOptions = { type: type, format: "plain-text", length: length };
    const rewriterOptions = { tone: tone, format: "plain-text", length: "as-is" };
    const maxCharLimit = 4000;

    const summary = await summarizeAndRewrite(content, summarizerOptions, rewriterOptions, maxCharLimit, role, context);
    // console.log("Content after prompt:", summary);


    const sanitizedSummary = DOMPurify.sanitize(summary);
    console.log("Sanitized summary:", sanitizedSummary);

    const summaryContainer = document.getElementById('summary-res');
    summaryContainer.value = sanitizedSummary; // Set the value of the textarea
    document.getElementById('summary-result').classList.remove('hidden');
    console.log("Summary displayed in HTML");

    // Attach bookmark functionality
    document.getElementById('add-bookmark').onclick = async () => {
      const editedSummary = summaryContainer.value;
      await db.addBookmark({
        url,
        title,
        summary: editedSummary,
        timestamp: new Date().toISOString(),
        faviconUrl: favIcon,
      });
      updateBookmarksList();
    };
  } catch (error) {
    console.error("Error generating summary:", error);
    alert("Failed to generate summary. See console for details.");
  }
});

//Update bookmarks list
// async function updateBookmarksList() {
//   const bookmarks = await db.getBookmarks();
//   const container = document.getElementById('bookmarks-list');
//   container.innerHTML = '';

//   bookmarks.forEach(bookmark => {
//     const div = document.createElement('div');
//     div.className = 'bookmark-item';
//     div.innerHTML = `
//       <h3><a href="${bookmark.url}" target="_blank">${bookmark.title}</a></h3>
//       <p>${bookmark.summary}</p>
//       <small>${new Date(bookmark.timestamp).toLocaleString()}</small>
//     `;
//     container.appendChild(div);
//   });
// }

// Update bookmarks list
async function updateBookmarksList() {
  const bookmarks = await db.getBookmarks();
  const container = document.getElementById('bookmarks-list');
  container.innerHTML = '';  // Clear the container before adding new content

  bookmarks.forEach(bookmark => {
    const div = document.createElement('div');
    div.className = 'bookmark-item';

    // Construct the favicon HTML
    const faviconHtml = bookmark.favicon
      ? `<img src="data:image/png;base64,${bookmark.favicon}" alt="Favicon" class="favicon" />`
      : `<img src="../icons/bookmark-solid.svg" alt="Default Favicon" class="favicon" />`; // Default favicon in case of failure

    div.innerHTML = `
      <div class="bookmark-header">
        ${faviconHtml}
        <h3><a href="${bookmark.url}" target="_blank">${bookmark.title}</a></h3>
      </div>
      <p>${bookmark.summary}</p>
      <small>${new Date(bookmark.timestamp).toLocaleString()}</small>
    `;
    container.appendChild(div);
  });
}


// Import/Export Bookmarks
document.getElementById('export-bookmarks').addEventListener('click', async () => {
  const url = await db.exportBookmarks();
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bookmarks.json';
  a.click();
});

document.getElementById('import-bookmarks').addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

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
