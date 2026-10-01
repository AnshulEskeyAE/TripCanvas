# PHASE 9 — UX DESIGN & FLOWS
**Project:** PM-06 | **Product:** TripCanvas
**Status:** Complete | Gate 9 Cleared

---

## 1. PURPOSE
With the MVP spec locked, this phase mapped what the user actually experiences: the four backbone activities, the states the dashboard moves through, and the acceptance criteria for each core flow. The output is what engineering would use to build.

---

## 2. USER STORY MAP (The Backbone)

The user journey is divided into 4 chronological backbone activities. 

| Backbone Activity | 1. Trip Setup | 2. Option Intake | 3. Compare & Calculate | 4. Visualize & Share |
| :--- | :--- | :--- | :--- | :--- |
| **High-Level Task** | Define the anchor constraints | Capture speculative choices | Build bundles & see true math | Get group consensus |
| **MVP Stories (Release 1)** | • Set Trip Name & Dates<br>• Set Budget Ceiling<br>• Set Currency & Party Size | • Paste URL for auto-title<br>• Manually enter price/times<br>• Auto-apply fee/tax rules | • Drag card to Plan A / Plan B<br>• View True Basket Math<br>• See CR-01/CR-02 Warnings | • Open Excalidraw Canvas<br>• Generate Shareable Hash URL<br>• Deep-link to book on OTA |
| **Deferred (Phase 1b+)** | • Cloud Sync (Accounts) | • Extension Clipper DOM scrape | • Google Maps Live Traffic<br>• Cross-currency conversion | • Collaborative multi-cursor sync |

---

## 3. INTERACTION STATE MACHINE

### 3A. Global Dashboard States
*   **State 0: Landing / Empty** — No trip in `localStorage`. 
    *   *UI:* Big "Create New Trip" modal.
*   **State 1: Blank Canvas** — Trip created. Deck is empty. 
    *   *UI:* Empty state illustration. Pulsing "+ Add First Option" button.
*   **State 2: Deck Populated** — Cards exist but none assigned to bundles. 
    *   *UI:* Unsorted Deck shows cards. Plan A / Plan B containers show dashed drop-zones ("Drag flights/stays here").
*   **State 3: Partial Allocation** — Cards in Plan A, but Plan B empty. 
    *   *UI:* Plan A calculates basket total and budget health. Plan B remains a drop-zone.
*   **State 4: Full Comparison** — Both bundles have $\ge 1$ transit and $\ge 1$ stay. 
    *   *UI:* Side-by-side basket totals. CR-01/CR-02 conflict engines actively displaying banners. "Open in Canvas" button pulses.

### 3B. Option Card Lifecyle
`DRAFT` (Missing required fields; disabled for drag) $\rightarrow$ `UNSORTED` (Complete; resides in Deck) $\leftrightarrow$ `PLAN_A / PLAN_B` (Actively computing in a bundle) $\rightarrow$ `REJECTED` (Archived; muted at bottom of screen).

---

## 4. WIREFRAME LAYOUT SPECIFICATIONS

*Note: Built for desktop/tablet priority to facilitate side-by-side drag-and-drop. Mobile degrades to stacked layout.*

### The Main Dashboard UI (App View)
![[Pasted image 20261001143952.png]]

---

## 5. CORE USER FLOWS & ACCEPTANCE CRITERIA (GHERKIN)

### Flow 1: Rapid Option Intake & Domain Rule Application
**Context:** User pastes an Airbnb link. The system must parse the OG title and apply the Airbnb fee rules.
*   **Given** the user is on the Dashboard
*   **When** they click "+ Add Option" and paste an Airbnb URL into the "Link" field
*   **Then** the `category` auto-switches to `AIRBNB`
*   **And** the `option_name` attempts to fetch the OpenGraph title
*   **And** the Fee Breakdown auto-populates "Service Fee (14% Est)" and "Cleaning Fee ($20 Est)"
*   **And** the user can manually enter the base price to immediately see the True Total update.

### Flow 2: Dragging & Budget Math
**Context:** Moving a card into a bundle updates the global math.
*   **Given** "Peach Air" ($110 True Total) is in the Unsorted Deck
*   **When** the user drags "Peach Air" into Plan A container
*   **Then** Plan A's `Bundle Basket Total` increases by $110
*   **And** the Budget Health bar expands to reflect the new percentage of the Budget Ceiling
*   **And** if the total exceeds the ceiling, the bar turns Red.

### Flow 3: Conflict Detection (CR-01 - Early Arrival)
**Context:** Simulating the core Spatio-Temporal calculation via OSRM.
*   **Given** Plan A contains a Flight landing at `10:00 AM`
*   **And** Plan A contains a Hotel with check-in at `03:00 PM`
*   **When** the Calculation Engine runs
*   **Then** it queries OSRM for driving time (e.g., 60 mins)
*   **And** computes Arrival at Hotel = `10:00 AM + 45m bags + 60m drive = 11:45 AM`
*   **And** computes the Luggage Gap = `03:00 PM - 11:45 AM = 3 hours 15 mins`
*   **Then** a 🟡 Warning Banner appears on the Hotel card: *"3.25-hr gap before check-in. Consider luggage drop-off."*

### Flow 4: Excalidraw Programmatic Generation
**Context:** Transitioning from data-grid to visual whiteboard.
*   **Given** Plan A and Plan B are populated with cards
*   **When** the user clicks "Open in Visual Canvas"
*   **Then** an embedded Excalidraw overlay opens
*   **And** the `updateScene()` API is fired automatically
*   **And** the canvas renders two parallel frames (Plan A and Plan B) containing rectangle and text elements mimicking the cards
*   **And** the user can freely draw arrows or add sticky notes without affecting the underlying Dashboard data.

---

## 6. ERROR & EDGE CASE HANDLING

| Scenario | System Behavior (Graceful Degradation) |
| :--- | :--- |
| **OSRM API fails / offline** | Fallback to static 60-minute transit buffer. Conflict banner notes: *(Estimated 1hr transit applied)*. |
| **OpenGraph fetch blocked (CORS/403)** | Form remains blank. User must type the title manually. No silent errors; UI merely waits for input. |
| **Checkout happens before Check-in** | Card enters `DRAFT` error state. Red inline text: *"Dates inverted"*. Excluded from Basket math until fixed. |
| **User sets Party Size = 0** | Field validation blocks setting $\le 0$. Auto-corrects to 1. |
| **URL Hash limit exceeded (12+ cards)** | If `lz-string` output $> 2000$ chars, "Share Link" button shows tooltip: *"Trip too large for link sharing. Use PNG export in Canvas."* |

---

## 7. EXIT CRITERIA FOR PHASE 9
- [x] State machine defined for trips, bundles, and cards.
- [x] Wireframe text-layout proves spatial feasibility of side-by-side comparison.
- [x] Gherkin criteria written for Domain Detection, Basket Math, Conflict Engine, and Canvas Sync.
- [x] Edge cases mapped with graceful degradation paths.

## 8. NEXT PHASE
[PHASE 10 — PRODUCT REQUIREMENTS DOCUMENT (PRD)](../Product%20Requirements.md) - The final synthesis of Phase 08 & 09 into the canonical build spec for engineering.
