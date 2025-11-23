// public/content-script.js
console.log('Dilio: Content script loaded on', window.location.href);

function showDilioPanel(amount) {
  console.log('Dilio: showDilioPanel called with amount:', amount);

  if (document.getElementById('dilio-panel')) return;

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

    <div style="margin: 12px 0;">
      <label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px; color:#475569;">
        Choose where to donate:
      </label>
      <select id="dilio-campaign-select" style="
        width:100%;
        padding:8px;
        border-radius:6px;
        border:1px solid #e5e7eb;
        font-size:13px;
        background:white;
        cursor:pointer;
      ">
        <option value="general">General Pool (Vote Later)</option>
        <option value="choose">Choose a Campaign →</option>
      </select>
    </div>

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

  document.getElementById("dilio-close").onclick = () => panel.remove();
  document.getElementById("dilio-skip").onclick = () => panel.remove();
  document.getElementById("dilio-confirm").onclick = () => {
    const selectedCampaign = document.getElementById("dilio-campaign-select").value;
    
    // Store selection and open extension
    chrome.storage?.local?.set({ 
      pendingPurchaseApproved: true,
      selectedCampaign: selectedCampaign
    }, () => {
      console.log("Dilio: user approved round up for campaign:", selectedCampaign);
      
      // Open the extension popup
      chrome.runtime.sendMessage({
        type: 'OPEN_EXTENSION',
        selectedCampaign: selectedCampaign
      });
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
  const elements = document.querySelectorAll(
    '[class*="total"], [id*="total"], [data-test*="total"]'
  );

  console.log('Dilio: extractAmount scanning', elements.length, 'elements');

  let lastAmount = null;

  elements.forEach(el => {
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
    if (!text) return;

    console.log('Dilio: candidate text:', `"${text}"`);

    const priceRegex = /\$([0-9,]+\.?[0-9]*)/g;
    let match;
    while ((match = priceRegex.exec(text)) !== null) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      console.log('Dilio:  -> found price', value, 'in text:', `"${text}"`);
      lastAmount = value;
    }
  });

  console.log('Dilio: extractAmount final result:', lastAmount);
  return lastAmount;
}

if (isCheckoutPage()) {
  console.log('Dilio: Checkout page detected!');

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