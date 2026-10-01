# PHASE 7 — SOLUTION EXPLORATION & ARCHITECTURE

## 1. PURPOSE
Three product architectures were on the table. This phase evaluated each against the core thesis, surfaced the real objections, resolved them, and locked the final architecture before scoping the MVP. The decision and its reasoning are documented here as the binding reference for everything downstream.

## 2. CORE QUESTION
Which technical architecture delivers the speculative comparison thesis fastest, with the lowest barrier to entry, while honoring the strict non-goals?

## 3. INPUT
- Phase 6 Strategy & Non-Goals ([06 - Decide the Strategy.md](06%20-%20Decide%20the%20Strategy.md)).
- Research on existing aggregator APIs vs. DOM scraping vs. manual entry.

---

## 4. WORK: THE ARCHITECTURAL OPTIONS MATRIX

### The Thinking Path
I needed a lightweight comparison workspace. My first instinct was a browser extension — it mirrored how I'd naturally want to use the product while browsing Expedia or Airbnb. But the moment I stress-tested it, the DOM brittleness problem was obvious. I also briefly considered an Aggregator API just to ensure I wasn't leaving a clean technical path on the table, but it immediately hit the OTA non-goal. That forced me to consider a blank web canvas, which solved the brittleness but introduced high user friction. I needed to map these trade-offs formally before deciding.

I evaluated three distinct vehicle concepts to solve the problem:

| Architecture Concept | How it works | Pros | Cons / Fatal Flaws |
| :--- | :--- | :--- | :--- |
| **Concept A:** The Magic Clipboard (Browser Extension) | User browses Expedia/Airbnb naturally. Extension scrapes price/dates from the DOM and injects a side-panel. | Zero context switching; captures data without manual typing. | **Fatal:** DOM brittleness. Airbnb changes their CSS classes weekly. The extension would break constantly. Also requires desktop install. |
| **Concept B:** The Universal Search App (Aggregator API) | A web app where users search for flights/hotels using our UI, powered by Skyscanner/Amadeus APIs. | Cleanest UI; reliable data. | **Fatal:** Evaluated purely to stress-test the non-goal. Confirmed that it violates the "No OTA" non-goal. Competing with Google Flights on search speed is a losing battle. High API costs for an MVP. |
| **Concept C:** The Blank Canvas (Link-Pasting Web App) | A blank web canvas. User pastes raw URLs from any site. The app fetches metadata (OpenGraph) and does the math. | Zero API dependency; works on mobile web; no extension install required. | **Flaw:** Higher user friction. Requires the user to actually copy-paste links manually. |

---

## 5. DECISION: CONCEPT H (THE HYBRID)

I selected a hybrid model based heavily on Concept C, but with an optional lightweight extension.

### The Final Solution Definition
**TripCanvas** is a web-based infinite canvas that acts as a multiplayer speculative spreadsheet. 
- **The Core Engine (Web):** Users paste URLs onto a canvas. The system extracts basic metadata, allows users to manually input the price (to bypass scraping blockers), and automatically snaps options into logical "Trip Plans" (Plan A vs. Plan B). It auto-calculates total costs and flags schedule conflicts.
- **The Optional Accelerator (Extension):** For desktop power users, a lightweight "Clipper" extension grabs the URL and price from the active tab and fires it to the web canvas, eliminating the copy-paste step. It does *not* inject UI into the booking site.

### The Component Map
```text
[ OTA / Airline Website ] 
       │
       ├─ (Desktop Power User) ──> [ Browser Clipper Extension ] ──┐
       │                                                           │
       └─ (Mobile / Web User) ───> [ Manual URL Copy-Paste ] ──────┼──> [ TripCanvas Web App ]
                                                                           ├─ Excalidraw Engine (Visuals)
                                                                           ├─ LocalStorage (State)
                                                                           └─ OSRM API (Transit distance)
```

---

## 6. OBJECTION HANDLING & RISK REGISTER

During the evaluation of the Hybrid Concept, three major objections were raised and resolved:

### Objection 1: DOM Brittleness (The "Extension Trap")
* **Risk:** Scraping prices from Airbnb/Expedia via a browser extension requires hardcoding CSS selectors, which break frequently.
* **Resolution (Mitigated):** The extension will *only* be an optional accelerator, not the core product. If the extension breaks, the web app still works via manual copy-paste. Furthermore, the extension will attempt to grab OpenGraph metadata first, falling back to CSS only as a last resort. If scraping fails entirely, it degrades gracefully by asking the user to manually type the price.

### Objection 2: The Desktop Install Gate
* **Risk:** Travel planning often happens across mobile and desktop. Forcing users to install an extension kills mobile adoption.
* **Resolution (Eliminated):** The web app is the primary interface. The extension is purely an add-on. Mobile users can paste links directly into the mobile web canvas.

### Objection 3: The Infinite Canvas Engineering Cost
* **Risk:** Building a drag-and-drop infinite canvas with grouping and lines from scratch is too expensive for an MVP.
* **Resolution (Eliminated):** I decided to embed `@excalidraw/excalidraw` as the base canvas layer. I will not build the canvas; I will only build the travel-specific data models (Option Cards, Trip Plans) that render *on top* of it.

---

## 7. RESEARCH / ANALYSIS METHODS
- Feasibility mapping (DOM scraping vs. API vs. OpenGraph).
- Pre-mortem risk assessment.

## 8. OUTPUTS
- Architecture Options Matrix.
- Final Solution Definition (The Hybrid).
- Risk Register & Mitigations.

## 9. DECISION
**GO (GATE 7 CLEARED)** — Concept H (The Hybrid) is selected. It avoids API costs, survives DOM changes, and leverages Excalidraw to drastically reduce frontend engineering time.

## 10. EXIT CRITERIA
A single, defensible architecture selected, with all major technical and adoption risks documented and mitigated.

## 11. FAILURE CONDITIONS
Selecting an architecture that requires massive upfront capital (e.g., GDS API licensing) before proving that users actually want to compare options this way.

## 12. BACKTRACK CONDITIONS
If prototyping the Excalidraw integration in Phase 8 proves that we cannot attach custom travel data models to Excalidraw objects.

## 13. AI ROLE
I used AI to challenge my assumptions during the architecture evaluation (specifically surfacing the DOM brittleness and install gate objections).

## 14. HUMAN ROLE
I evaluated the architecture trade-offs, decided to accept the friction of manual copy-pasting (Concept C), and formulated the Hybrid Concept to avoid the existential risk of API costs and brittle scrapers.

## 15. COMMON FAILURE MODES
Picking the "coolest" technology (a fully automated AI scraper) instead of the most robust, MVP-friendly one.

## 16. STATUS
Phase 7 is complete and locked. All three components defined, all three objections resolved. Phase 8 scopes the minimum version of the Hybrid that tests the core hypothesis — without building the full §5 product vision.
