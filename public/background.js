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
});
