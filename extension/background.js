// background.js - Service worker for TripCanvas extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('[TripCanvas Clipper] Extension installed.');
  chrome.storage.local.set({
    pending_cards: [],
  });
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CLIP_CARD' && request.card) {
    const card = request.card;

    // 1. Save to local storage queue
    chrome.storage.local.get(['pending_cards'], (result) => {
      const queue = result.pending_cards || [];
      queue.push(card);
      chrome.storage.local.set({ pending_cards: queue });

      // 2. Try to forward immediately to any open TripCanvas tabs
      chrome.tabs.query({ url: ['*://localhost:5173/*', '*://localhost:3000/*', '*://127.0.0.1:5173/*'] }, (tabs) => {
        if (tabs && tabs.length > 0) {
          tabs.forEach((t) => {
            if (t.id) {
              chrome.tabs.sendMessage(t.id, {
                type: 'EXTENSION_CARD_CLIPPED',
                card,
              });
            }
          });
        }
      });

      // 3. Flash visual badge on extension icon
      chrome.action.setBadgeText({ text: '✓' });
      chrome.action.setBadgeBackgroundColor({ color: '#0d9488' });
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '' });
      }, 2500);

      sendResponse({ status: 'CLIPPED', count: queue.length });
    });

    return true; // Keep channel open for async response
  }
});
