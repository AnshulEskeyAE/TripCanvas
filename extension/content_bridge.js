// content_bridge.js - Injected into TripCanvas web dashboard (localhost:5173)

console.log('[TripCanvas Extension] Bridge initialized on Dashboard.');

// 1. Flush any pending cards from chrome.storage to the web app
function flushPendingCards() {
  chrome.storage.local.get(['pending_cards'], (result) => {
    const queue = result.pending_cards || [];
    if (queue.length > 0) {
      console.log(`[TripCanvas Extension] Flushing ${queue.length} pending cards to Dashboard.`);
      queue.forEach((card) => {
        window.postMessage({ type: 'TRIPCANVAS_CARD_CLIPPED', card }, window.location.origin);
      });
      chrome.storage.local.set({ pending_cards: [] });
    }
  });
}

// 2. Request current trip metadata from Dashboard on load
function requestTripMetadata() {
  window.postMessage({ type: 'TRIPCANVAS_REQUEST_SYNC' }, window.location.origin);
}

// 3. Listen for direct messages from the extension popup/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTENSION_CARD_CLIPPED' && message.card) {
    window.postMessage({ type: 'TRIPCANVAS_CARD_CLIPPED', card: message.card }, window.location.origin);
    sendResponse({ success: true });
  }
});

// 4. Listen for web app responses to store active trip metadata
window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin) return;

  if (event.data?.type === 'TRIPCANVAS_SYNC_RESPONSE' && event.data?.trip) {
    chrome.storage.local.set({
      active_trip: event.data.trip,
    });
    console.log('[TripCanvas Extension] Synced active trip metadata:', event.data.trip.trip_name);
  }
});

// Run sync on load
setTimeout(() => {
  requestTripMetadata();
  flushPendingCards();
}, 800);
