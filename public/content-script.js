// Content script to detect checkout pages
console.log('Dilio: Content script loaded on', window.location.href);

function isCheckoutPage() {
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();
  
  const checkoutPatterns = [
    'checkout', 'cart', 'basket', 'payment', 
    'order', 'review', 'shipping', 'billing'
  ];
  
  return checkoutPatterns.some(pattern => 
    url.includes(pattern) || title.includes(pattern)
  );
}

function extractAmount() {
  const selectors = [
    '[class*=\"total\"]',
    '[class*=\"grand-total\"]',
    '[class*=\"order-total\"]',
    '[id*=\"total\"]',
    '[data-test*=\"total\"]'
  ];
  
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      const text = el.textContent;
      const match = text.match(/\\$([0-9,]+\\.?[0-9]*)/);
      if (match) {
        return parseFloat(match[1].replace(',', ''));
      }
    }
  }
  return null;
}

if (isCheckoutPage()) {
  console.log('Dilio: Checkout page detected!');
  
  const observer = new MutationObserver(() => {
    const buttons = document.querySelectorAll('button, input[type=\"submit\"], a[class*=\"button\"]');
    buttons.forEach(button => {
      const text = button.textContent.toLowerCase();
      if ((text.includes('place order') || 
          text.includes('complete purchase') ||
          text.includes('pay now') ||
          text.includes('checkout') ||
          text.includes('submit order')) && 
          !button.dataset.dilioAttached) {
        
        button.dataset.dilioAttached = 'true';
        button.addEventListener('click', () => {
          const amount = extractAmount();
          console.log('Dilio: Purchase button clicked, amount:', amount);
          
          if (amount) {
            chrome.runtime.sendMessage({
              type: 'CHECKOUT_DETECTED',
              amount: amount,
              url: window.location.href
            });
          }
        });
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  setTimeout(() => {
    const amount = extractAmount();
    if (amount) {
      console.log('Dilio: Amount detected on page load:', amount);
    }
  }, 2000);
}