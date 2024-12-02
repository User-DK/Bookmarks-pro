// Extract Page Content
async function extractPageContent() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab.url.startsWith('http')) {
    throw new Error("Cannot summarize non-HTTP/HTTPS pages.");
  }

  const injection = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    // func: () => document.body.innerText, // Extract visible text from the page
    files: ['scripts/extract-content.js']
  });

  if (!injection || !injection[0]?.result) {
    throw new Error("Failed to extract page content.");
  }

  let cleanedText = injection[0].result.replace(/\[.*?\]/g, "");

  cleanedText = cleanedText.replace(/\[edit\]/gi, "");

  cleanedText = cleanedText
    .replace(/\s{2,}/g, " ")
    .replace(/\n+/g, "\n")
    .replace(/\n\s*\n/g, '\n')
    .replace(/chrome:\/\/[^\s]+/g, '') // Remove any URL of the type chrome://
    .replace(/http?:\/\/[^\s]+/g, '') // Remove any URL of the type http:// or https://
    .replace(/https?:\/\/[^\s]+/g, '') // Remove any URL of the type http:// or https://
    .replace(/:\/\/[^\s]+/g, '') // Remove any URL of the type http:// or https://
    .trim();

  return { content: cleanedText, url: tab.url, title: tab.title, favIconUrl: tab.favIconUrl };
}

async function getPageSelection() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    throw new Error('No active tab found');
  }

  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      return {
        content: window.getSelection().toString(),
      };
    },
  });

  const selectedContent = result?.result?.content || '';

  return {
    content: selectedContent,
    url: tab.url,
    title: tab.title,
    favIconUrl: tab.favIconUrl
  };
}

export { extractPageContent, getPageSelection };