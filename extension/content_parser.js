// content_parser.js - In-situ DOM parser for travel sites

(function () {
  function extractPageTravelData() {
    const url = window.location.href;
    const host = window.location.hostname.toLowerCase();

    let title = '';
    let headlinePrice = 0;
    let detectedCurrency = '';
    let category = 'HOTEL';
    let location = '';
    let checkIn = '';
    let checkOut = '';
    let isParsed = false;

    // Helper: Parse currency and number from text (e.g. "$250", "₹16,598", "€180")
    function parsePriceAndCurrency(str) {
      if (!str) return { price: 0, symbol: '' };
      const match = str.match(/([$₹€£¥])\s*([0-9,]+)/);
      if (match && match[2]) {
        const p = parseInt(match[2].replace(/,/g, ''), 10) || 0;
        return { price: p, symbol: match[1] };
      }
      const genericMatch = str.match(/([0-9,]+)\s*(?:total|per night|\/night|for [0-9]+ nights)/i);
      if (genericMatch && genericMatch[1]) {
        const p = parseInt(genericMatch[1].replace(/,/g, ''), 10) || 0;
        return { price: p, symbol: '' };
      }
      return { price: 0, symbol: '' };
    }

    // Helper: Extract check-in & check-out from URL params if present
    try {
      const urlObj = new URL(url);
      const ci = urlObj.searchParams.get('check_in') || urlObj.searchParams.get('checkin');
      const co = urlObj.searchParams.get('check_out') || urlObj.searchParams.get('checkout');
      if (ci) {
        checkIn = ci.includes('T') ? ci : `${ci}T15:00`;
      }
      if (co) {
        checkOut = co.includes('T') ? co : `${co}T11:00`;
      }
    } catch (e) {
      console.debug('[TripCanvas] URL date extraction notice:', e);
    }

    // 1. AIRBNB PARSER
    if (host.includes('airbnb.')) {
      category = 'AIRBNB';
      const h1 = document.querySelector('h1');
      if (h1 && h1.innerText.trim()) {
        title = h1.innerText.trim();
        isParsed = true;
      }

      // Look for price in booking sidebar / sticky footer first
      const bookingContainers = document.querySelectorAll(
        'div[data-section-id="BOOK_IT_SIDEBAR"], div[data-testid="book-it-default"], div[data-testid="book-it-floating-footer"], [data-testid="price-summary"], div._1jo4hgw, [data-section-id="SIDEBAR_DEFAULT"]'
      );
      for (const container of bookingContainers) {
        const els = container.querySelectorAll('span, div');
        for (const el of els) {
          if (el.children.length === 0 && (el.innerText.includes('₹') || el.innerText.includes('$') || el.innerText.includes('€') || el.innerText.includes('£') || el.innerText.includes('¥'))) {
            const res = parsePriceAndCurrency(el.innerText);
            if (res.price > 50) {
              headlinePrice = res.price;
              if (res.symbol) detectedCurrency = res.symbol;
              break;
            }
          }
        }
        if (headlinePrice > 0) break;
      }

      // Broad search if not found
      if (!headlinePrice) {
        const priceEls = document.querySelectorAll(
          'span._tyxjp1, [data-testid="price-summary"] span, div._1jo4hgw, span._1y74zjx, span[style*="--price"]'
        );
        for (const el of priceEls) {
          const res = parsePriceAndCurrency(el.innerText);
          if (res.price > 0) {
            headlinePrice = res.price;
            if (res.symbol) detectedCurrency = res.symbol;
            break;
          }
        }
      }

      // Search all text if still 0
      if (!headlinePrice) {
        const allSpans = Array.from(document.querySelectorAll('span, div'));
        for (const el of allSpans) {
          if (el.children.length === 0 && (el.innerText.includes('₹') || el.innerText.includes('$') || el.innerText.includes('€') || el.innerText.includes('£'))) {
            const res = parsePriceAndCurrency(el.innerText);
            if (res.price > 100 && res.price < 5000000) {
              headlinePrice = res.price;
              if (res.symbol) detectedCurrency = res.symbol;
              break;
            }
          }
        }
      }

      // Extract location
      const headings = document.querySelectorAll('h2, div[data-section-id="OVERVIEW_DEFAULT"] h2, span[elementtiming="LCP-target"]');
      for (const el of headings) {
        const txt = el.innerText || '';
        const match = txt.match(/in\s+([A-Za-z\s]+,\s*[A-Za-z\s]+)/i);
        if (match && match[1]) {
          location = match[1].trim();
          break;
        }
      }
      if (!location) {
        const locEl = document.querySelector('div[data-testid="photo-viewer-header"] h2, a[href*="#location"]');
        if (locEl) location = locEl.innerText.trim();
      }

      // If dates weren't in URL, check DOM date labels (e.g. "10/15/2026")
      if (!checkIn) {
        const dateInputs = document.querySelectorAll('div[data-testid*="check-in"], div[data-testid*="checkIn"], div[id*="check-in"]');
        for (const el of dateInputs) {
          const m = el.innerText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (m) {
            const y = m[3];
            const mo = m[1].padStart(2, '0');
            const d = m[2].padStart(2, '0');
            checkIn = `${y}-${mo}-${d}T15:00`;
            break;
          }
        }
      }
      if (!checkOut) {
        const dateInputs = document.querySelectorAll('div[data-testid*="checkout"], div[data-testid*="checkOut"], div[id*="checkout"]');
        for (const el of dateInputs) {
          const m = el.innerText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (m) {
            const y = m[3];
            const mo = m[1].padStart(2, '0');
            const d = m[2].padStart(2, '0');
            checkOut = `${y}-${mo}-${d}T11:00`;
            break;
          }
        }
      }
    }

    // 2. GOOGLE FLIGHTS / GOOGLE TRAVEL PARSER
    else if (host.includes('google.') && (url.includes('/travel/') || url.includes('/flights'))) {
      category = 'FLIGHT';
      const flightHeader = document.querySelector('h1, h2, [role="heading"]');
      if (flightHeader) {
        title = flightHeader.innerText.trim();
        isParsed = true;
      }

      const allSpans = Array.from(document.querySelectorAll('span, div'));
      for (const el of allSpans) {
        if (el.children.length === 0 && (el.innerText.includes('$') || el.innerText.includes('₹') || el.innerText.includes('€') || el.innerText.includes('£') || el.innerText.includes('¥'))) {
          const res = parsePriceAndCurrency(el.innerText);
          if (res.price > 20 && res.price < 500000) {
            headlinePrice = res.price;
            if (res.symbol) detectedCurrency = res.symbol;
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
        const res = parsePriceAndCurrency(priceEl.innerText);
        headlinePrice = res.price;
        if (res.symbol) detectedCurrency = res.symbol;
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
        title = document.title.split('|')[0].split('-')[0].trim() || 'Custom Travel Option';
      }
    }

    // If airline in URL
    if (host.includes('indigo') || host.includes('airindia') || host.includes('akasa') || host.includes('spicejet') || host.includes('flight')) {
      category = 'FLIGHT';
    }

    return {
      title,
      headline_price: headlinePrice,
      currency_symbol: detectedCurrency,
      check_in: checkIn,
      check_out: checkOut,
      category,
      location,
      url,
      isParsed,
    };
  }

  // Return extracted data to caller
  return extractPageTravelData();
})();
