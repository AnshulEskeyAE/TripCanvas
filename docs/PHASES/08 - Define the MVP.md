# PHASE 8 — MVP SPECIFICATION
**Project:** PM-06 | **Product:** TripCanvas — The Speculative Travel Comparison Canvas (Hybrid)
**Status:** Locked | Gate 8 Cleared → Phase 09 (UX Design & Flows)

---

## 1. PURPOSE
To define the definitive, engineering-ready minimum viable system requirements for TripCanvas (Hybrid). Every system, schema, calculation rule, and edge case in this document is locked and serves as the baseline for Phase 09 (UX Flows) and Phase 10 (PRD).

---

## 2. CORE QUESTION & HYPOTHESIS

### Core Question
What is the smallest buildable version of the Hybrid that a real lead trip organizer would choose over opening a blank Google Sheet?

### The Core Hypothesis Under Test
> **"If lead trip organizers can capture candidate options in under 60 seconds each, see the true all-in basket cost per bundle (with platform-detected fees), and receive automated schedule-conflict warnings powered by free routing data — all without switching to a spreadsheet or logging in — they will use TripCanvas instead of a blank Google Sheet during the pre-booking evaluation window."**

---

## 3. ARCHITECTURAL BOUNDARIES & KEY PRINCIPLES

1. **Zero-Install Core (The Web Dashboard):** The central product runs entirely in the browser. No login, no Google OAuth, and no backend database required for MVP.
2. **Client-Side Persistence (`localStorage`):** Trips, candidate cards, and bundle assignments are stored in browser `localStorage`. Data persists across tab closes and browser restarts.
3. **Anonymous Telemetry (No Sign-up Gate):** User activity and funnel metrics are tracked via a persistent, anonymous client UUID (`anonymous_id`) in `localStorage` without collecting personal identification.
4. **Embedded Visual Whiteboard:** Bundled `@excalidraw/excalidraw` React component renders comparison frames programmatically via `updateScene()` without dependency on external third-party servers.
5. **Zero-Cost External Integrations:** Free, open-source routing APIs (OSRM / Nominatim) deliver real transit durations with zero API key or credit card requirements.

---

## 4. DETAILED SYSTEM SPECIFICATIONS

```
┌────────────────────────────────────────────────────────────────────────┐
│                              TRIPCANVAS MVP                            │
│                                                                        │
│  SYSTEM 1            SYSTEM 2          SYSTEM 3         SYSTEM 4       │
│  Trip Setup & Deck → Card Intake    →  Calculation   →  Canvas &       │
│  (Budget Anchor)     (Domain Engine)   Engine (OSRM)    Share Hash     │
└────────────────────────────────────────────────────────────────────────┘
```

---

### SYSTEM 1 — Trip Setup & Workspace Anchor

* **Objective:** Anchor the trip with clear dates, currency, party size, and target budget ceiling before speculative comparison starts.

#### Data Model: `Trip`
| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `trip_id` | UUID | ✅ | Auto-generated client-side (`crypto.randomUUID()`). |
| `trip_name` | String | ✅ | e.g. "Kyoto & Tokyo — Nov 10–16". Max 60 chars. |
| `origin_city` | String | Optional | e.g. "Bangalore (BLR)". |
| `destination_city` | String | ✅ | e.g. "Kyoto, Japan". Used as default geocoding anchor. |
| `start_date` | Date | ✅ | Start of trip window. |
| `end_date` | Date | ✅ | End of trip window (> `start_date`). |
| `currency` | Enum | ✅ | INR (₹), USD ($), EUR (€), GBP (£), JPY (¥), etc. Default: INR. |
| `budget_ceiling` | Numeric | ✅ | Target spending ceiling for transit and lodging (e.g. ₹80,000). |
| `party_size` | Integer | ✅ | Default: 1. Used to compute per-person share cost. |
| `created_at` | Timestamp | ✅ | Epoch time for cohort analysis. |

* **The Unsorted Deck:** All incoming or newly created cards initially land in a central, visible "Unsorted Deck" before being drag-assigned into **Plan A** or **Plan B**.

---

### SYSTEM 2 — Card Intake & Domain Detection Engine

* **Objective:** Add an option in $\le 30$ seconds. Auto-detect platform-specific fee patterns from URLs while providing instant manual fallback.

#### The Domain Detection Engine
When a user pastes a URL or enters a listing link, the system parses the domain and auto-configures fee estimation rules and tax defaults:

| Detected Domain Pattern | Category | Auto-Configured Fee Rule | Statutory Tax Rule |
| :--- | :--- | :--- | :--- |
| `airbnb.*` | `AIRBNB` | Service Fee: +14% of headline rate; Cleaning Fee: Default ₹1,500 (\$20) flat (prompt user to verify). | Local occupancy tax estimate: +10% |
| `booking.com` | `HOTEL` | Resort / Destination Fee estimate: +₹800 (\$10) / night. | Hotel GST / VAT: +12% / +18% based on rate |
| `makemytrip.com` / `cleartrip.com` | `HOTEL` / `FLIGHT` | Convenience fee: +₹350 flat; Baggage rules checked. | Statutory GST: +18% (Hotel), +8% (Flight) |
| `indigo.in` / `airindia.com` / `akasaair.com` | `FLIGHT` | Unbundled checked baggage: +₹1,200 flat (LCC tier). | Domestic fuel/airport fee: +8% |
| `expedia.*` / `hotels.com` | `HOTEL` | Hotel resort fee flag active; taxes at checkout flag. | Country-specific tax bracket |
| Unknown / Manual | User selects | Standard category heuristics apply. | Editable tax field |

#### Data Model: `OptionCard`
```typescript
interface OptionCard {
  card_id: string;              // UUID
  trip_id: string;              // Belongs to trip
  title: string;                // e.g. "IndiGo 6E-204" or "Central Kyoto Machiya"
  category: 'FLIGHT' | 'TRAIN' | 'HOTEL' | 'AIRBNB' | 'EXCURSION';
  headline_price: number;       // Base price shown on booking site
  estimated_fees: number;       // Auto-computed via Domain Engine or manual
  fee_breakdown: {              // Transparent line-items
    label: string;
    amount: number;
    is_statutory_tax: boolean;
  }[];
  departure_or_checkin: string; // ISO DateTime
  arrival_or_checkout: string;  // ISO DateTime
  spatial_anchor: {             // Neighborhood, airport code, or address
    raw_query: string;          // e.g. "Indiranagar, Bangalore" or "KIX Airport"
    latitude?: number;          // Resolved via Nominatim (OSM)
    longitude?: number;
  };
  pros_tags: string[];          // e.g. ["Near Metro", "Breakfast Inc."]
  cons_tags: string[];          // e.g. ["Strict Cancellation", "Late Check-in"]
  merchant_url?: string;        // Deep link back to provider
  bundle: 'UNSORTED' | 'PLAN_A' | 'PLAN_B' | 'REJECTED';
}
```

* **Entry Resilience (No Silent Failures):** If URL metadata cannot be parsed, the Quick Card form instantly displays with the URL preserved and fields highlighted for fast manual fill.

---

### SYSTEM 3 — Calculation Engine & Free Transit Routing

* **Objective:** Compute true all-in costs and evaluate multi-variable spatio-temporal trade-offs using open routing data.

#### 3A — True Basket Cost Formula
$$\text{Option True Total} = \text{Headline Price} + \sum \text{Estimated Fees} + (\text{Headline Price} \times \text{Buffer \%})$$
$$\text{Bundle Basket Total} = \sum_{\text{Cards} \in \text{Bundle}} \text{Option True Total}$$
$$\text{Per-Person Cost} = \frac{\text{Bundle Basket Total}}{\text{Party Size}}$$

* **Budget Health Telemetry:**
  - **Green:** Spend $\le 75\%$ of budget ceiling.
  - **Amber:** Spend between $75\%$ and $95\%$ of ceiling.
  - **Red / Warning:** Spend $> 95\%$ or exceeds ceiling (*"Over Budget: In-trip spending at risk"*).

#### 3B — Dynamic Spatio-Temporal Conflict Engine (OSRM Powered)
Uses OpenStreetMap (Nominatim Geocoding + OSRM Routing) for zero-cost, credit-card-free transit duration calculations:

1. **Geocode Step (Nominatim):** Resolves flight airport code/name and accommodation spatial anchor to `(lat, lon)` coordinates.
2. **Drive Duration (OSRM):** Queries `router.project-osrm.org` for baseline driving time in seconds.
3. **City Congestion Buffer:** Multiplies base driving duration by $1.25$ ($+25\%$ urban traffic buffer).
4. **Fallback:** Defaults to flat 60-minute transit buffer if coordinates are not resolved or client is offline.

#### The 3 Evaluated Conflict Rules:
* **Rule CR-01: Early Arrival / Stranded Luggage Gap**
  $$\text{Effective Arrival at Stay} = \text{Flight Landing} + 45\text{m (Deboard/Bags)} + \text{Transit Time}$$
  $$\text{Luggage Gap} = \text{Check-in Time} - \text{Effective Arrival at Stay}$$
  - $\text{Luggage Gap} \le 2\text{ hours}$: **No Warning** (Smooth transition).
  - $2\text{ hours} < \text{Gap} \le 5\text{ hours}$: 🟡 **Warning Banner** (*"Flight lands at [Time]. [X]-hr gap before check-in. Consider luggage drop-off or early check-in."*).
  - $\text{Gap} > 5\text{ hours}$: 🔴 **Severe Warning** (*"Critical [X]-hr gap. Traveler will be stranded with heavy luggage for half the day."*).

* **Rule CR-02: Departure Rush / Missed Flight Risk**
  $$\text{Window} = \text{Flight Departure} - (\text{Stay Checkout} + \text{Transit Time})$$
  - $\text{Window} \ge 2.5\text{ hours}$: **Safe Buffer.**
  - $\text{Window} < 2.5\text{ hours}$: 🟠 **Caution Banner** (*"Check-out and airport transit leave less than 2.5 hours before flight. High risk of missing boarding gate."*).

* **Rule CR-03: Temporal Inversion Error**
  - Trigger: `checkout_time <= checkin_time`.
  - Action: 🔴 Blocks card from calculations until date/time sequence is corrected.

---

### SYSTEM 4 — Embedded Excalidraw Whiteboard & Serverless Share

* **Objective:** Produce a spatial comparison canvas and a zero-install shareable link without server infrastructure.

#### 4A — Embedded Excalidraw Integration
* Bundles `@excalidraw/excalidraw` directly in the React frontend.
* On clicking **"Sync & Open in Canvas"**, executes `updateScene()` with pre-calculated layout coordinates:
  - **Plan A Container (Left):** Bounding rectangle, bold title, total cost header, component cards, and green/red conflict indicators.
  - **Plan B Container (Right):** Parallel bounding rectangle, comparative cost delta tag (e.g. *"+₹12,400 vs Plan A"*).
  - **Visual Arrows & Badges:** Pre-styled hand-drawn badges for Pros/Cons and warning banners.

#### 4B — Serverless Read-Only Share URL
* Serializes the trip state into JSON, compresses via `lz-string`, and appends to the URL hash:
  `https://tripcanvas.app/view#[compressed_state_hash]`
* **Recipient Experience:** Co-travelers open the link on WhatsApp/mobile browser. No login, no extension. Renders a clean comparison table: Plan A vs. Plan B with per-person costs, flight times, and pros/cons tags.
* Capacity: Supports up to 12 cards cleanly within standard URL length limits (< 2,000 characters).

---

## 5. ANALYTICS & PRIVACY ARCHITECTURE (NO OAUTH)

To satisfy PM governance requirements without forcing user authentication:

1. **Client Identity:** On first visit, a persistent UUID (`tc_anonymous_id`) is stored in `localStorage`.
2. **Event Instrumentation (PostHog / Lightweight telemetry):**
   - `trip_initialized`: Track destination, currency, budget ceiling.
   - `option_card_added`: Track category, domain detected, manual vs. parsed.
   - `bundle_compared`: Fired when both Plan A and Plan B have at least 1 transit + 1 stay card.
   - `conflict_detected`: Fired when CR-01 or CR-02 triggers.
   - `canvas_opened`: Fired when Excalidraw scene renders.
   - `share_link_created`: Fired when user copies URL for group voting.
   - `shared_view_opened`: Fired by co-travelers (tracks viral coefficient $K$).

---

## 6. COMPLETE FEATURE INCLUSION / EXCLUSION MATRIX

| Feature Area | Included in Phase 8 MVP | Explicitly Excluded (Post-MVP) |
| :--- | :--- | :--- |
| **Authentication** | ❌ 100% Login-Free | Google OAuth / Email Signups |
| **Database & Cloud** | ❌ Pure `localStorage` | PostgreSQL / Firebase sync |
| **Capture Layer** | ✅ Quick Card Form + URL Domain Engine | Live OTA DOM Scraping (Extension is Phase 1b) |
| **Pricing Intelligence** | ✅ Domain rules + Statutory taxes + Buffer % | Real-time GDS flight pricing APIs |
| **Transit Engine** | ✅ Free OSRM Driving Time + Nominatim | Paid Google Maps Distance Matrix API |
| **Visual Comparison** | ✅ Embedded `@excalidraw/excalidraw` | Live multi-player collaborative cursor sync |
| **Collaboration** | ✅ Compressed URL Hash sharing (read-only) | Real-time chat / comment threads |

---

## 7. DECISION & GATE CLEARANCE

### **DECISION: GO — GATE 8 FULLY CLEARED**
All 5 open decision questions have been evaluated and resolved:
- **OQ-01 (Fees):** Resolved via Domain Detection Engine (Airbnb, Booking.com, Airlines) + Statutory Tax rules.
- **OQ-02 & OQ-03 (Conflicts):** Resolved via Free OSRM routing duration + 45m airport logistics + 25% urban buffer.
- **OQ-04 (Persistence):** Locked to 100% `localStorage` with anonymous client UUID telemetry.
- **OQ-05 (Sharing):** Locked to 12-card `lz-string` URL hash compression.

**Exit Criteria Satisfied:** All five open questions resolved. Specs are complete, technically feasible at zero API cost, and non-goal compliant. Proceeding to UX mapping.

---

## 8. NEXT PHASE
[PHASE 9 — UX DESIGN & FLOWS](09%20-%20Design%20the%20Experience.md)
