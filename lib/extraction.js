// Extract Page Content
async function extractPageContent() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  if (!tab.url.startsWith("http")) {
    throw new Error("Cannot summarize non-HTTP/HTTPS pages.");
  }

  const injection = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["scripts/extract-content.js"],
  });

  if (!injection || !injection[0]?.result) {
    throw new Error("Failed to extract page content.");
  }

  let cleanedText = injection[0].result.replace(/\[.*?\]/g, "");

  cleanedText = cleanedText.replace(/\[edit\]/gi, "");

  cleanedText = cleanedText
    .replace(/\s{2,}/g, " ")
    .replace(/\n+/g, "\n")
    .replace(/\n\s*\n/g, "\n")
    .replace(/chrome:\/\/[^\s]+/g, "")
    .replace(/http?:\/\/[^\s]+/g, "")
    .replace(/https?:\/\/[^\s]+/g, "")
    .replace(/:\/\/[^\s]+/g, "")
    .trim();

  return {
    content: cleanedText,
    url: tab.url,
    title: tab.title,
    favIconUrl: tab.favIconUrl,
  };
}

async function getPageSelection() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    throw new Error("No active tab found");
  }

  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      return {
        content: window.getSelection().toString(),
      };
    },
  });

  const selectedContent = result?.result?.content || "";

  return {
    content: selectedContent,
    url: tab.url,
    title: tab.title,
    favIconUrl: tab.favIconUrl,
  };
}

export { extractPageContent, getPageSelection };
