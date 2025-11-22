// Content script to detect checkout pages
console.log('Dilio: Content script loaded on', window.location.href);

function showDilioPanel(amount) {
  console.log('Dilio: showDilioPanel called with amount:', amount);

  // Prevent duplicates
  if (document.getElementById('dilio-panel')) return;

  // Store pending purchase immediately so Dashboard can process it
  chrome.storage?.local?.set(
    {
      pendingPurchase: {
        amount,
        url: window.location.href,
        timestamp: Date.now(),
      },
    },
    () => console.log("Dilio: pendingPurchase stored:", amount)
  );

  const panel = document.createElement("div");
  panel.id = "dilio-panel";

  
  panel.style.position = "fixed";
  panel.style.bottom = "20px";
  panel.style.right = "20px";
  panel.style.zIndex = "2147483647";
  panel.style.background = "#ffffff";
  panel.style.borderRadius = "12px";
  panel.style.boxShadow = "0 8px 20px rgba(0,0,0,0.25)";
  panel.style.padding = "16px";
  panel.style.maxWidth = "320px";
  panel.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  panel.style.fontSize = "14px";

  const roundedUp = Math.ceil(amount) - amount;
  const roundedUpDisplay = roundedUp.toFixed(2);

  
  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <strong style="font-size:14px;">Round up with Dilio?</strong>
      <button id="dilio-close" 
        style="border:none;background:none;font-size:16px;cursor:pointer;line-height:1;">
        ×
      </button>
    </div>

    <p style="margin:0 0 8px 0;">
      Your total is <strong>$${amount.toFixed(2)}</strong>.<br>
      Round up <strong>$${roundedUpDisplay}</strong> to support a campus cause.
    </p>

    <button id="dilio-confirm" style="
      width:100%;
      margin-top:8px;
      padding:8px 0;
      border-radius:8px;
      border:none;
      cursor:pointer;
      background:#2563eb;
      color:white;
      font-weight:600;
    ">
      Yes, round up with Dilio
    </button>

    <button id="dilio-skip" style="
      width:100%;
      margin-top:6px;
      padding:6px 0;
      border-radius:8px;
      border:1px solid #e5e7eb;
      background:white;
      cursor:pointer;
      font-size:12px;
    ">
      Not this time
    </button>
  `;

  document.body.appendChild(panel);

  // Close
  document.getElementById("dilio-close").onclick = () => panel.remove();

  // Skip
  document.getElementById("dilio-skip").onclick = () => panel.remove();

  // Confirm
  document.getElementById("dilio-confirm").onclick = () => {
    chrome.storage?.local?.set({ pendingPurchaseApproved: true }, () => {
      console.log("Dilio: user approved round up");
    });
    panel.remove();
  };
}

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
  // Look at all "total-ish" elements
  const elements = document.querySelectorAll(
    '[class*="total"], [id*="total"], [data-test*="total"]'
  );

  console.log('Dilio: extractAmount scanning', elements.length, 'elements');

  let lastAmount = null;

  elements.forEach(el => {
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
    if (!text) return;

    // Log what we're seeing
    console.log('Dilio: candidate text:', `"${text}"`);

    // Find ALL prices in this text (subtotal, previous subtotal, estimated total, etc.)
    const priceRegex = /\$([0-9,]+\.?[0-9]*)/g;
    let match;
    while ((match = priceRegex.exec(text)) !== null) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      console.log('Dilio:  -> found price', value, 'in text:', `"${text}"`);
      // Take the *last* seen price; often the final one is "estimated total"
      lastAmount = value;
    }
  });

  console.log('Dilio: extractAmount final result:', lastAmount);
  return lastAmount;
}


if (isCheckoutPage()) {
  console.log('Dilio: Checkout page detected!');

  // First pass – might be 0 or null
  let amount = extractAmount();
  console.log('Dilio: Initial extracted amount inside content script:', amount);

  if (amount && amount > 0) {
    console.log('Dilio: Showing panel from initial amount');
    showDilioPanel(amount);
  } else {
    console.log('Dilio: Skipping panel, initial amount not usable:', amount);
  }

  const observer = new MutationObserver(() => {
    const buttons = document.querySelectorAll('button, input[type="submit"], a[class*="button"]');
    buttons.forEach(button => {
      const text = (button.textContent || '').toLowerCase();
      if ((text.includes('place order') ||
        text.includes('complete purchase') ||
        text.includes('pay now') ||
        text.includes('checkout') ||
        text.includes('submit order')) &&
        !button.dataset.dilioAttached) {

        button.dataset.dilioAttached = 'true';
        console.log('Dilio: Attached listener to button:', text.trim());

        button.addEventListener('click', () => {
          const freshAmount = extractAmount();
          console.log('Dilio: Purchase button clicked, amount:', freshAmount);

          if (freshAmount && freshAmount > 0) {
            chrome.runtime.sendMessage({
              type: 'CHECKOUT_DETECTED',
              amount: freshAmount,
              url: window.location.href
            });

            if (!document.getElementById('dilio-panel')) {
              console.log('Dilio: Showing panel from button click');
              showDilioPanel(freshAmount);
            }
          } else {
            console.log('Dilio: Skipping panel on click, amount not usable:', freshAmount);
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Second pass after Walmart finishes rendering totals
  setTimeout(() => {
    const laterAmount = extractAmount();
    console.log('Dilio: Amount detected on page load:', laterAmount);

    if (laterAmount && laterAmount > 0 && !document.getElementById('dilio-panel')) {
      console.log('Dilio: Showing panel from delayed amount');
      showDilioPanel(laterAmount);
    } else {
      console.log('Dilio: Skipping delayed panel, amount not usable or panel already present');
    }
  }, 2000);
}
