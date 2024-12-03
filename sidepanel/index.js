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
    const { content, url, title, favIconUrl } = contenttype === 'selected-text' ? await getPageSelection() : await extractPageContent();
    console.log("Extracted content:", content);
    console.log("URL:", url);
    console.log("Title:", title);
    console.log("favIconUrl URL:", favIconUrl);
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

    const sanitizedSummary = DOMPurify.sanitize(summary);
    console.log("Sanitized summary:", sanitizedSummary);
    const summaryContainer = document.getElementById('summary-res');
    summaryContainer.value = sanitizedSummary; // Set the value of the textarea
    document.getElementById('summary-result').classList.remove('hidden');
    console.log("Summary displayed in HTML");

    document.getElementById('add-bookmark').onclick = async () => {
      const editedSummary = summaryContainer.value;
      await db.addBookmark({
        url,
        title,
        summary: editedSummary,
        timestamp: new Date().toISOString(),
        favIconUrl: favIconUrl,
      });
      updateBookmarksList();
    };
  } catch (error) {
    console.error("Error generating summary:", error);
  }
});

function truncateText(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

async function updateBookmarksList() {
  const bookmarks = await db.getBookmarks();
  const container = document.getElementById('bookmarks-list');
  container.innerHTML = '';  

  bookmarks.forEach(bookmark => {
    const div = document.createElement('div');
    div.className = 'bookmark-item';
    console.log('faviconUrl After:', bookmark.favIconUrl);
    console.log(bookmark);
    const truncatedTitle = truncateText(bookmark.title, 30);

    const faviconHtml = bookmark.favIconUrl
      ? `<img src="${bookmark.favIconUrl}" alt="Favicon" class="favicon" />`
      : `<i class="fa-solid fa-globe fa-xl"></i>`; 

    div.innerHTML = `
      <div class="bookmark-header">
        ${faviconHtml}
        <a href="${bookmark.url}" target="_blank" class="bookmark-title" data-full-title="${bookmark.title}">
            ${truncatedTitle}
          </a>
      </div>
      <p style="margin-top: 0.4rem;
  font-size: 1.5rem;">${bookmark.summary}</p>
      <div class="timestamp-container">
      <small>${new Date(bookmark.timestamp).toLocaleString()}</small>
      </div>
    `;
    container.appendChild(div);
  });

  document.querySelectorAll('.bookmark-title').forEach(titleElement => {
    const truncatedTitle = titleElement.textContent;
    const fullTitle = titleElement.getAttribute('data-full-title');

    titleElement.addEventListener('mouseenter', () => {
      titleElement.textContent = fullTitle;
    });

    titleElement.addEventListener('mouseleave', () => {
      titleElement.textContent = truncatedTitle;
    });
  });
}


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
