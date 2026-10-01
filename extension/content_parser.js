// content_parser.js - In-situ DOM parser for travel sites

(function () {
  function extractPageTravelData() {
    const url = window.location.href;
    const host = window.location.hostname.toLowerCase();

    let title = '';
    let headlinePrice = 0;
    let category = 'HOTEL';
    let location = '';
    let isParsed = false;

    // Helper: Parse first currency number from text (e.g. "$250", "₹12,400", "€180")
    function parsePriceFromText(str) {
      if (!str) return 0;
      const match = str.match(/([$₹€£¥])\s*([0-9,]+)/);
      if (match && match[2]) {
        return parseInt(match[2].replace(/,/g, ''), 10) || 0;
      }
      const genericMatch = str.match(/([0-9,]+)\s*(?:total|per night|\/night)/i);
      if (genericMatch && genericMatch[1]) {
        return parseInt(genericMatch[1].replace(/,/g, ''), 10) || 0;
      }
      return 0;
    }

    // 1. AIRBNB PARSER
    if (host.includes('airbnb.')) {
      category = 'AIRBNB';
      const h1 = document.querySelector('h1');
      if (h1 && h1.innerText.trim()) {
        title = h1.innerText.trim();
        isParsed = true;
      }

      // Look for price elements
      const priceEls = document.querySelectorAll(
        'span._tyxjp1, [data-testid="price-summary"] span, div._1jo4hgw'
      );
      for (const el of priceEls) {
        const p = parsePriceFromText(el.innerText);
        if (p > 0) {
          headlinePrice = p;
          break;
        }
      }

      // Location from breadcrumb or address
      const locEl = document.querySelector('div[data-testid="photo-viewer-header"] h2, span[elementtiming="LCP-target"]');
      if (locEl) location = locEl.innerText.trim();
    }

    // 2. GOOGLE FLIGHTS / GOOGLE TRAVEL PARSER
    else if (host.includes('google.') && (url.includes('/travel/') || url.includes('/flights'))) {
      category = 'FLIGHT';
      // Look for selected flight details or main header
      const flightHeader = document.querySelector('h1, h2, [role="heading"]');
      if (flightHeader) {
        title = flightHeader.innerText.trim();
        isParsed = true;
      }

      // Find price text
      const allSpans = Array.from(document.querySelectorAll('span, div'));
      for (const el of allSpans) {
        if (el.children.length === 0 && (el.innerText.includes('$') || el.innerText.includes('₹') || el.innerText.includes('€'))) {
          const p = parsePriceFromText(el.innerText);
          if (p > 20 && p < 100000) {
            headlinePrice = p;
            break;
          }
        }
      }
    }

    // 3. BOOKING.COM PARSER
    else if (host.includes('booking.com')) {
      category = 'HOTEL';
      const nameEl = document.querySelector('h2.pp-header__title, #hp_hotel_name, h2.d2fee87e0e');
      if (nameEl) {
        title = nameEl.innerText.trim().replace(/^Hotel\s+/i, '');
        isParsed = true;
      }

      const priceEl = document.querySelector('.prco-valign-middle-helper, .bui-price-display__value, span.f6431b446c');
      if (priceEl) {
        headlinePrice = parsePriceFromText(priceEl.innerText);
      }

      const addressEl = document.querySelector('.hp_address_subtitle, [data-node_tt_id="location_score_tooltip"]');
      if (addressEl) location = addressEl.innerText.trim();
    }

    // 4. GENERIC OPEN GRAPH FALLBACK (Any airline or hotel website)
    if (!title) {
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle && ogTitle.content) {
        title = ogTitle.content.split('|')[0].split('-')[0].trim();
      } else {
        title = document.title.split('|')[0].split('-')[0].trim() || 'Custom Listing';
      }
    }

    // If airline in URL
    if (host.includes('indigo') || host.includes('airindia') || host.includes('akasa') || host.includes('spicejet') || host.includes('flight')) {
      category = 'FLIGHT';
    }

    return {
      title,
      headline_price: headlinePrice,
      category,
      location,
      url,
      isParsed,
    };
  }

  // Return extracted data to caller
  return extractPageTravelData();
})();
