// Background service worker
console.log('Dilio: Background service worker loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Dilio: Message received:', request);

  if (request.type === 'CHECKOUT_DETECTED') {
    // Store the purchase info
    chrome.storage.local.set({
      pendingPurchase: {
        amount: request.amount,
        url: request.url,
        timestamp: Date.now()
      }
    });

    // Show badge to indicate pending donation
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });

    // Open the popup automatically
    chrome.action.openPopup();
  }

  if (request.type === 'OPEN_EXTENSION') {
    // Store the selected campaign
    chrome.storage.local.set({
      selectedCampaign: request.selectedCampaign
    });

    // Show badge
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });

    // Open the popup
    chrome.action.openPopup();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.pendingPurchase) {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });
  }
});