// popup.js - Controller for TripCanvas Clipper extension popup

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const activeTripLabel = document.getElementById('active-trip-label');
  const statusBanner = document.getElementById('status-banner');
  const statusText = document.getElementById('status-text');
  const statusIcon = document.getElementById('status-icon');
  const titleInput = document.getElementById('title');
  const categorySelect = document.getElementById('category');
  const bundleSelect = document.getElementById('bundle');
  const optPlanA = document.getElementById('opt-plan-a');
  const optPlanB = document.getElementById('opt-plan-b');
  const priceInput = document.getElementById('price');
  const currencyPrefix = document.getElementById('currency-prefix');
  const bufferInput = document.getElementById('buffer');
  const trueCostDisplay = document.getElementById('true-cost-display');
  const feesList = document.getElementById('fees-list');
  const timeStart = document.getElementById('time-start');
  const timeEnd = document.getElementById('time-end');
  const locationInput = document.getElementById('location');
  const prosInput = document.getElementById('pros');
  const consInput = document.getElementById('cons');
  const merchantUrlInput = document.getElementById('merchant-url');
  const form = document.getElementById('clipper-form');
  const toast = document.getElementById('toast');
  const clipBtn = document.getElementById('clip-btn');

  let activeTrip = null;
  let activeCurrency = 'INR';
  let activeCurrencySym = '₹';

  // 1. Check for active trip metadata synced from dashboard
  chrome.storage.local.get(['active_trip'], (res) => {
    if (res.active_trip) {
      activeTrip = res.active_trip;
      activeTripLabel.textContent = `Trip: ${activeTrip.trip_name || 'Active Workspace'}`;
      if (activeTrip.plan_a_name) optPlanA.textContent = `🟩 ${activeTrip.plan_a_name}`;
      if (activeTrip.plan_b_name) optPlanB.textContent = `🟦 ${activeTrip.plan_b_name}`;
      if (activeTrip.currency) {
        activeCurrency = activeTrip.currency;
        activeCurrencySym = activeCurrency === 'INR' ? '₹' : activeCurrency === 'EUR' ? '€' : activeCurrency === 'GBP' ? '£' : activeCurrency === 'JPY' ? '¥' : '$';
        if (currencyPrefix) currencyPrefix.textContent = activeCurrencySym;
      }
    } else {
      activeTripLabel.textContent = 'Trip: Kyoto & Tokyo (Default)';
    }
    calculateFeesAndTrueTotal();
  });

  // 2. Scan active tab for travel data using content_parser.js
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id && tab.url && !tab.url.startsWith('chrome://')) {
      merchantUrlInput.value = tab.url;

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content_parser.js'],
      });

      const parsedData = results?.[0]?.result;
      if (parsedData) {
        if (parsedData.title) titleInput.value = parsedData.title;
        if (parsedData.headline_price > 0) priceInput.value = parsedData.headline_price;
        if (parsedData.category) categorySelect.value = parsedData.category;
        if (parsedData.location) locationInput.value = parsedData.location;

        // Auto-fill dates
        if (parsedData.check_in) timeStart.value = parsedData.check_in;
        if (parsedData.check_out) timeEnd.value = parsedData.check_out;

        // Auto-detect currency
        if (parsedData.currency_symbol) {
          activeCurrencySym = parsedData.currency_symbol;
          activeCurrency = activeCurrencySym === '₹' ? 'INR' : activeCurrencySym === '€' ? 'EUR' : activeCurrencySym === '£' ? 'GBP' : activeCurrencySym === '¥' ? 'JPY' : 'USD';
          if (currencyPrefix) currencyPrefix.textContent = activeCurrencySym;
        }

        if (parsedData.isParsed) {
          statusBanner.className = 'status-banner success';
          if (statusIcon) statusIcon.textContent = '✓';
          try {
            const hostname = new URL(tab.url).hostname.replace('www.', '');
            statusText.textContent = `Auto-parsed from ${hostname}`;
          } catch {
            statusText.textContent = 'Auto-parsed from page';
          }
        } else {
          statusBanner.className = 'status-banner';
          if (statusIcon) statusIcon.textContent = 'ℹ️';
          statusText.textContent = `Page title detected. Verify price & details below.`;
        }
      }
    } else {
      statusBanner.className = 'status-banner';
      if (statusIcon) statusIcon.textContent = '✏️';
      statusText.textContent = 'Ready for manual entry';
    }
  } catch (err) {
    console.debug('[TripCanvas] Scripting injection fallback:', err);
    statusBanner.className = 'status-banner';
    if (statusIcon) statusIcon.textContent = '✏️';
    statusText.textContent = 'Ready for entry';
  }

  // 3. Dynamic Fee Calculation
  function calculateFeesAndTrueTotal() {
    const headline = parseFloat(priceInput.value) || 0;
    const bufferPct = parseFloat(bufferInput.value) || 0;
    const cat = categorySelect.value;
    const url = (merchantUrlInput.value || '').toLowerCase();

    if (currencyPrefix) {
      currencyPrefix.textContent = activeCurrencySym;
    }

    if (headline === 0) {
      trueCostDisplay.textContent = `${activeCurrencySym}0`;
      feesList.innerHTML = '<div style="color: #64748b; font-size: 10.5px; padding: 2px 0;">Enter headline base price to compute checkout fees</div>';
      return { computedFees: [], bufferAmount: 0, trueTotal: 0 };
    }

    let computedFees = [];

    // Platform fee estimation rules
    if (cat === 'AIRBNB' || url.includes('airbnb.')) {
      computedFees.push({ label: 'Airbnb Guest Service Fee (14%)', amount: Math.round(headline * 0.14) });
      computedFees.push({ label: 'Cleaning Fee (Est)', amount: activeCurrency === 'INR' ? 1500 : 25 });
    } else if (cat === 'HOTEL' || url.includes('booking.')) {
      computedFees.push({ label: 'VAT / Occupancy Tax (12%)', amount: Math.round(headline * 0.12) });
      computedFees.push({ label: 'Resort / City Fee (Est)', amount: activeCurrency === 'INR' ? 800 : 15 });
    } else if (cat === 'FLIGHT') {
      computedFees.push({ label: 'Checked Baggage (Est)', amount: activeCurrency === 'INR' ? 1200 : 25 });
      computedFees.push({ label: 'Aviation Taxes (8%)', amount: Math.round(headline * 0.08) });
    } else if (cat === 'EXCURSION') {
      computedFees.push({ label: 'Booking & Processing (5%)', amount: Math.round(headline * 0.05) });
    }

    const feesSum = computedFees.reduce((acc, f) => acc + f.amount, 0);
    const bufferAmount = Math.round((headline * bufferPct) / 100);
    const trueTotal = headline + feesSum + bufferAmount;

    trueCostDisplay.textContent = `${activeCurrencySym}${trueTotal.toLocaleString()}`;

    // Render fee rows
    feesList.innerHTML = '';
    computedFees.forEach((f) => {
      const row = document.createElement('div');
      row.className = 'fee-row';
      row.innerHTML = `
        <span class="fee-name">+ ${f.label}</span>
        <span class="fee-amount">${activeCurrencySym}${f.amount.toLocaleString()}</span>
      `;
      feesList.appendChild(row);
    });

    if (bufferAmount > 0) {
      const bufRow = document.createElement('div');
      bufRow.className = 'fee-row';
      bufRow.innerHTML = `
        <span class="fee-name">+ Custom Safety Buffer (${bufferPct}%)</span>
        <span class="fee-amount">${activeCurrencySym}${bufferAmount.toLocaleString()}</span>
      `;
      feesList.appendChild(bufRow);
    }

    return { computedFees, bufferAmount, trueTotal };
  }

  priceInput.addEventListener('input', calculateFeesAndTrueTotal);
  bufferInput.addEventListener('input', calculateFeesAndTrueTotal);
  categorySelect.addEventListener('change', calculateFeesAndTrueTotal);

  // Initial calculation
  calculateFeesAndTrueTotal();

  // 4. Handle Submit ("Clip to TripCanvas")
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clipBtn.disabled = true;
    clipBtn.innerHTML = '<span>Clipping to canvas...</span>';

    const { computedFees } = calculateFeesAndTrueTotal();

    const newCard = {
      card_id: `ext_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      trip_id: activeTrip?.trip_id || 'sample_kyoto_trip',
      title: titleInput.value.trim(),
      category: categorySelect.value,
      headline_price: parseFloat(priceInput.value) || 0,
      fee_breakdown: computedFees.map((f) => ({
        label: f.label,
        amount: f.amount,
        is_statutory_tax: f.label.includes('Tax') || f.label.includes('VAT'),
        is_estimate: true,
      })),
      buffer_pct: parseFloat(bufferInput.value) || 0,
      departure_or_checkin: timeStart.value || undefined,
      arrival_or_checkout: timeEnd.value || undefined,
      spatial_anchor: { raw_query: locationInput.value.trim() },
      pros_tags: prosInput.value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      cons_tags: consInput.value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      merchant_url: merchantUrlInput.value || undefined,
      bundle: bundleSelect.value,
      created_at: Date.now(),
    };

    // Forward to background service worker
    chrome.runtime.sendMessage({ type: 'CLIP_CARD', card: newCard }, (response) => {
      toast.classList.remove('hidden');
      clipBtn.innerHTML = '<span>✓ Option Clipped!</span>';

      setTimeout(() => {
        window.close();
      }, 1400);
    });
  });
});
