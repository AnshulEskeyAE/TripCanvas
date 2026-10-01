# PRODUCT REQUIREMENTS DOCUMENT (PRD)
**Project:** PM-06 | **Product:** TripCanvas
**Status:** Approved | Gate 10 Cleared

---

## 1. PROBLEM STATEMENT

**The problem:**
For the lead trip organizer in the pre-booking phase (after dates and destination are decided), evaluating multi-item travel choices is an exhausting, trial-and-error chore. Booking platforms operate in isolated vertical silos that hide true checkout costs and prevent side-by-side trade-off comparison between flights, stays, and arrival schedules.

**Evidence that this problem is real:**
UX research (Phase 03) reveals organizers juggle 15–25 simultaneous tabs and manually transcribe headline prices into makeshift Google Sheets. Drip fees (cleaning fees, resort fees, baggage tiers) routinely invalidate earlier comparisons. Spatio-temporal misalignment (e.g., flight lands at 9 AM, check-in at 3 PM) creates hidden "stranded luggage" gaps that commercial OTA platforms ignore.

**Why this problem is worth solving now:**
Existing travel tools (TripIt, Wanderlog) are designed for *post-booking* itinerary management. Nobody has built a native workspace for the chaotic *pre-booking* speculative window that isn't a fragile browser scraper or an empty spreadsheet.

**What happens if this is not solved:**
Organizers will continue to endure high cognitive fatigue, spend hours manually translating data, and suffer unexpected checkout budget creep that forces them into spending cutbacks during their vacation.

---

## 2. USER SEGMENT

**Primary user:**
The Lead Organizer / Primary Trip Planner. This is the individual within a friend group, couple, or family who volunteers (or is volunteered) to execute the research, build the comparison spreadsheet, and drive the group to a booking consensus.

**Users explicitly out of scope:**
- Corporate/business travel bookers (who have managed platforms/agents).
- Passive co-travelers (they will consume the shareable link, but they are not the primary creators).
- Top-of-funnel daydreamers (users who do not yet know where or when they are going).

---

## 3. OBJECTIVE

**Business objective:**
To establish a dominant wedge in the pre-booking travel phase, ultimately becoming the default decision layer that sits above the fragmented OTA ecosystem.

**User objective:**
To rapidly assemble, compare, and stress-test competing travel bundles side-by-side with automatic true-basket math and schedule conflict warnings, without ever opening a spreadsheet.

---

## 4. SUCCESS METRICS

**North Star metric for this MVP:**
> **Bundle Comparison Completion Rate:** The percentage of initialized trips that successfully assemble a Plan A vs. Plan B comparison (i.e., at least one transit and one stay card in two separate bundles).
*Rationale:* This proves the user found enough value in the intake and calculation engines to complete the core "trade-off" workflow.

**Supporting metrics (leading indicators):**
| Metric | What it measures | Why it matters |
|--------|----------------|----------------|
| **Card Intake Speed** | Time elapsed between clicking "Add Option" and saving the card. | Principle #1 is to beat Google Sheets on speed (target $\le 30$ seconds). |
| **Share Link Generation** | Percentage of completed comparisons where the user clicks "Share Read-Only Link". | Validates the "group consensus" friction point. |
| **Viral Coefficient ($K$)** | Ratio of unique shared-link viewers per active Organizer. | Measures organic word-of-mouth distribution. |

**Guardrail metrics (do not regress):**
| Metric | Why it must be protected |
|--------|-------------------------|
| **Manual Price/Fee Override Rate** | If $> 40\%$ of users override the Domain Engine fee defaults, our automated math value proposition is failing and breaking trust. |
| **Session Abandonment** | If users create a trip but leave before adding a single card, the empty state UI or intake friction is too high. |

---

## 5. SCOPE

#### In Scope (MVP)

| User Story | Priority | Rationale |
|-----------|----------------------------------|-----------|
| As an organizer, I want to paste an Airbnb/Airline link and have the platform auto-apply standard fee estimates so I see the true cost without doing math. | Must | Core hypothesis validation (True Basket Visibility). |
| As an organizer, I want to drag candidate options into two distinct bundles (Plan A / Plan B) so I can compare them side-by-side. | Must | Eliminates the makeshift spreadsheet behavior. |
| As an organizer, I want to be warned if my flight arrives hours before my hotel check-in so I don't get stranded with luggage. | Must | Addresses the #1 schedule friction point identified in Phase 03. |
| As an organizer, I want to share a read-only visual summary with my group so they can vote without digging through links. | Must | Solves the consensus bottleneck; drives viral acquisition. |

#### Out of Scope (Explicit Non-Goals)

| Item | Why excluded |
|------|-------------|
| **Live API Price Scraping** | Too brittle. Silent scraper failures break the core promise of checkout-cost accuracy. |
| **User Accounts / Cloud Sync** | Unnecessary for session-level hypothesis testing. `localStorage` suffices. |
| **Browser Extension Clipper** | Pushed to Phase 1b. The dashboard alone is sufficient to test the calculation and comparison hypotheses. |
| **Booking Engine / Payments** | Strategic non-goal. The product is a decision layer, not a transaction layer. |

---

## 6. REQUIREMENTS

#### Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | **Domain Detection Engine:** When a URL is pasted, system must match domains (`airbnb.com`, `indigo.in`) and auto-apply pre-defined fee/tax default arrays. | Must | Powers the "True Basket" intelligence. |
| FR-002 | **OSRM Transit Routing:** System must query `router.project-osrm.org` with Geocoded lat/longs to compute driving duration. | Must | Zero-cost dynamic conflict detection. |
| FR-003 | **Spatio-Temporal Rules:** System must flag 🟡 (>2h gap) and 🔴 (>5h gap) for arrival vs check-in. | Must | Core USP over Google Sheets. |
| FR-004 | **Excalidraw Generation:** System must programmatically generate an Excalidraw scene (`updateScene()`) with Plan A and Plan B layout frames. | Must | Replaces ugly spreadsheets with a whiteboard. |
| FR-005 | **URL Hash State Sharing:** System must compress JSON state via `lz-string` and Base64-encode it into the URL hash for serverless sharing. | Must | Enables zero-install group consensus. |

#### Non-Functional Requirements

| ID | Requirement | Category | Notes |
|----|-------------|---------|-------|
| NFR-001 | **Persistence:** State must save to `localStorage` on every mutation. | Reliability | No data loss on accidental tab close. |
| NFR-002 | **Performance:** Card intake modal must open instantly; URL OpenGraph fetch must timeout after 3s (fallback to manual). | Speed | Strict adherence to $\le 5$s entry principle. |

---

## 7. UX CONSIDERATIONS

**Critical user flows:**
1. **The Quick Capture:** User clicks "+ Add Option" $\rightarrow$ pastes URL $\rightarrow$ title auto-fills, user types base price, domain engine applies 14% fee $\rightarrow$ Card saved to Deck.
2. **The Conflict Reveal:** User drags Flight A and Hotel A into Plan A $\rightarrow$ Calculation engine runs $\rightarrow$ OSRM returns 45m drive $\rightarrow$ Card turns red highlighting a 6-hour luggage gap.
3. **The Share:** User clicks "Share Link" $\rightarrow$ opens in incognito $\rightarrow$ sees read-only Plan A vs B without extension or login.

**Key UX principles for this feature:**
> *"Never fail silently."* If OSRM is down, clearly state "Flat 60m estimate applied." If a URL cannot be parsed, leave the input blank and let the user type. The user must always trust the math.

**Edge cases to consider:**
- **No Internet during transit fetch:** Fallback to 60-minute heuristic.
- **Trip size exceeds URL hash limits (12+ cards):** Display a graceful error on the Share button prompting the user to use the PNG export in the Visual Canvas instead.
- **Checkout is before Check-in:** DRAFT state. Exclude from math to prevent `NaN` or negative gaps.

---

## 8. TECHNICAL CONSIDERATIONS

**Technical approach (directional):**
- React SPA (Vite).
- Global State: Zustand (with `persist` middleware for `localStorage`).
- OpenGraph Proxy: Simple serverless edge function (e.g., Cloudflare Worker) strictly for fetching `<meta property="og:title">` to bypass CORS.
- UI Components: Tailwind CSS + Radix UI / shadcn.
- Canvas: `@excalidraw/excalidraw` npm package.
- Routing: `lz-string` parsing from `window.location.hash`.

**Known technical constraints:**
- `@excalidraw/excalidraw` is a heavy package (~2MB). Must be dynamically imported (`React.lazy`) so the initial dashboard load remains fast.
- OSRM public server has a fair-use policy. While sufficient for MVP, high scale will require our own hosted OSRM droplet ($5/mo).

**Dependencies:**
| Dependency | Type | Impact if blocked |
|-----------|--------------|------------------|
| OSRM Public API | External | Degrades to 60-min flat heuristic |
| Nominatim API | External | Geocoding fails; degrades to heuristic |
| Cloudflare Worker | Edge | URL paste will not auto-fill title; manual entry only |

---

## 9. MVP DEFINITION

**The MVP is:**
A zero-install React SPA that allows a lead organizer to manually input (or paste) candidate travel options, automatically calculates the true basket cost via domain-specific fee defaults, detects schedule conflicts using free OpenStreetMap routing, and outputs a shareable read-only link or an Excalidraw visual canvas.

**Why this is the right MVP:**
It isolates and tests the core hypotheses (True cost math + Spatio-temporal conflict warnings) without incurring the immense engineering risk of live OTA scraping, user authentication, or cloud databases.

**MVP success condition:**
If the MVP achieves a Bundle Comparison Completion Rate of $> 60\%$ in moderated usability testing, and users rate the "trustworthiness" of the True Total math $\ge 4/5$, I will proceed to full build (including the Phase 1b Extension Clipper).

---

## 10. GO-TO-MARKET CONSIDERATIONS

**How will users discover this feature?**
MVP distribution relies heavily on the **$K$-factor (viral loop)**. Because every trip ends in a "Share Link" sent to a group chat, every active organizer exposes TripCanvas to 2–5 highly relevant potential future users (travelers).

**Rollout plan:**
1. **Alpha:** 10 hand-picked lead organizers planning upcoming real trips.
2. **Beta:** Open web access.
3. **Phase 1b:** Launch the Extension Clipper on the Chrome Web Store to capture power-users who want 1-click DOM extraction.

---

## 11. OPEN QUESTIONS & RESOLUTIONS (GATE 10)

| Question | Verification Result / Engineering Resolution | Status |
|---------|---------------------------------------------|--------|
| **OSRM Rate Limiting:** What is the limit on the public demo server before IP ban? | **1 Request per second max.** Engineering must pass a custom `User-Agent` (e.g., `TripCanvas/1.0`) containing contact info per OSRM's API Usage Policy. Client-side state must strictly debounce/throttle drag-and-drop actions by $\ge 1000$ms before firing the routing API to avoid HTTP 429 Too Many Requests errors. | **CLOSED** |
| **OpenGraph Edge Worker:** Do OTAs (like Airbnb) actively block Cloudflare IPs from fetching OG tags? | **YES.** Airbnb, Booking.com, and major airlines use aggressive bot protection (DataDome/PerimeterX) that explicitly block datacenter/Cloudflare IPs with 403 Forbidden or CAPTCHA challenges. | **CLOSED** |

**Engineering Mitigation for OpenGraph Blocking:**
Because the edge worker *will* fail to fetch titles from OTAs ~80% of the time, the Quick Card Form MUST be built with **Zero-Friction Fallback**. The `fetch()` request must have a strict 2-second timeout. If it hits a 403 or times out, the input immediately unlocks and displays: *"Could not auto-fetch title. Please enter manually."* This limitation actually proves the necessity of the Phase 1b Browser Extension (which circumvents bot protection by reading the DOM directly via the user's browser).

---

## 12. APPENDIX

**Related documents:**
- [Phase 08 - MVP Specification](PHASES/08%20-%20Define%20the%20MVP.md)
- [Phase 09 - UX Design & Flows](PHASES/09%20-%20Design%20the%20Experience.md)
- [Phase 06 - Strategy](PHASES/06%20-%20Decide%20the%20Strategy.md)
---
*Template version 1.0 applied.*
