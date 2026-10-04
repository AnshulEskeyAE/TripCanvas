# TripCanvas 🗺️

> A decision-layer workspace for the chaotic pre-booking phase of group travel.

**TripCanvas** lets a lead trip organiser pull in flights, hotels, and activities from any OTA (Airbnb, Booking.com, Google Flights, MakeMyTrip, IndiGo) and compare two complete bundles — **Plan A vs Plan B** — with automatic true-basket cost totalling, hidden-fee detection, and spatio-temporal conflict alerts (e.g. "you land at 9 AM but check-in is 3 PM — 6 h of stranded luggage").

This repository contains the following core components:

| Component | Path | What it is |
|---|---|---|
| **Web App** | [`/app`](./app/) | React + Vite + Zustand workspace — the core product |
| **Browser Extension** | [`/extension`](./extension/) | Chrome MV3 clipper — reads OTA pages for you |
| **PM Docs** | [`/docs`](./docs/) | Full product management lifecycle artifacts (PRD, discovery, strategy) |
| **Case Study Deck** | [`TripCanvas_Product_Strategy_Case_Study.pdf`](./TripCanvas_Product_Strategy_Case_Study.pdf) | 20-slide executive case study deck |

---

## Features

- **Side-by-side bundle comparison** — Plan A vs Plan B with live cost totals
- **True-basket math** — base price + drip fees + taxes summed automatically
- **Conflict detection engine** — flags schedule gaps between transit and stay
- **One-click OTA clipping** — browser extension reads your live page and sends a structured card into the app via `localStorage`
- **Zero-install share** — export your canvas to a compressed URL hash; anyone with the link sees the exact same plan
- **Visual canvas mode** — push both plans to an Excalidraw whiteboard for async group review and voting

---

## Architecture

```
Browser Extension (MV3 content scripts)
  Airbnb / Booking.com / Google Flights / MakeMyTrip / IndiGo
         |
         | clips structured JSON via localStorage
         v
TripCanvas Web App
  +------------+    +------------------+    +-------------+
  | Unsorted   | -> |  Bundle Grid     | -> | Excalidraw  |
  | Deck       |    |  Plan A / Plan B |    | Canvas      |
  +------------+    +------------------+    +-------------+
                           |
               +-----------v-----------+
               |   Conflict Engine     |
               |  (OSRM routing API)   |
               +-----------------------+
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| State | Zustand 5 with localStorage persistence |
| Styling | Tailwind CSS v4 |
| Canvas | @excalidraw/excalidraw |
| Share | URL hash + lz-string compression |
| Conflict API | OSRM (OpenStreetMap routing) |
| Extension | Chrome MV3 — activeTab, scripting, storage |

---

## Installation & Launch

Both the web app and the browser extension must be running together for the full clipping workflow to function.

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- Google Chrome

---

### Step 1 — Web Application

```bash
# Clone the repository
git clone https://github.com/AnshulEskeyAE/tripcanvas.git
cd tripcanvas

# Install dependencies
cd app
npm install

# Start the development server
npm run dev
```

Open **http://localhost:5173** in Chrome.

The app runs entirely on `localStorage` — no database, no auth, no API keys required.

---

### Step 2 — Browser Extension (Chrome)

The extension is loaded as an unpacked extension (not published to the Chrome Web Store).

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `extension/` folder from this repository

The TripCanvas Clipper icon will appear in your browser toolbar.

**Supported OTA domains:**
- airbnb.com
- booking.com
- google.com/travel and /flights
- makemytrip.com
- indigo.in

---

### Step 3 — Using the Clipper

1. Navigate to a supported OTA and open any listing or flight result
2. Click the TripCanvas Clipper icon in your toolbar
3. The extension extracts title, price, check-in/out or flight times from the page
4. Click **Clip to TripCanvas** — the card appears in your Unsorted Deck automatically
5. Drag it into Plan A or Plan B to start comparing

---

## Repository Structure

```
tripcanvas/
├── README.md
├── .gitignore
├── TripCanvas_Product_Strategy_Case_Study.pdf   Executive PM case study deck (PDF)
│
├── app/                        Web application
│   ├── src/
│   │   ├── components/         UI components (BundleColumn, OptionCard, etc.)
│   │   ├── engines/            Core logic (conflictEngine, domainEngine, shareEngine)
│   │   ├── store/              Zustand global state (tripStore)
│   │   ├── views/              Page views (Dashboard, ShareView)
│   │   └── types/              TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
│
├── extension/                  Chrome MV3 browser extension
│   ├── manifest.json
│   ├── popup.html / popup.js / popup.css
│   ├── background.js           Service worker
│   ├── content_parser.js       OTA DOM extraction logic
│   ├── content_bridge.js       localStorage bridge to web app
│   └── icons/
│
└── docs/                       PM case study artifacts
    ├── Product Requirements.md Canonical PRD
    ├── PHASES/                 Discovery through MVP phases (00 - 13)
    ├── assets/                 User research & visual documentation
    └── design/                 Excalidraw wireframes
```

---

## How the Clipping Bridge Works

The extension and app communicate without any backend:

```
OTA Page (content_parser.js)
  extracts structured JSON from the DOM
  passes to popup.js via chrome.runtime messaging

Popup (popup.js)
  user confirms the clip
  writes JSON to localStorage key: tripcanvas_incoming_clip

App (tripStore.ts / content_bridge.js)
  listens for storage events on that key
  ingests the card into the Unsorted Deck
  clears the key
```

No server. No OAuth. No API quota. Runs entirely in the browser.

---

## Available Scripts

Run these from inside the `app/` directory:

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 5173 |
| `npm run build` | TypeScript compile + Vite production bundle |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run oxlint |

---

## PM Documentation & Case Study Deck

### 1. Executive Presentation & Strategy Deck
* **Executive Presentation Deck (PDF):** [`TripCanvas_Product_Strategy_Case_Study.pdf`](./TripCanvas_Product_Strategy_Case_Study.pdf) — A 20-slide executive case study covering problem discovery, user research, product strategy, conflict detection engines, and go-to-market.

### 2. Full PM Lifecycle Documentation
The [`/docs`](./docs/) folder contains the complete Product Management lifecycle artifact for TripCanvas:
* **Canonical PRD:** [`docs/Product Requirements.md`](./docs/Product%20Requirements.md) — Comprehensive problem statement, user personas, MVP scope, Gherkin acceptance criteria, and non-functional requirements.
* **Phased Journey:** Start at [docs/PHASES/00 - Start Here.md](./docs/PHASES/00%20-%20Start%20Here.md) covering discovery, problem framing, strategy, MVP definition, and wireframe designs.
* **Project Status Tracker:** [`docs/Where Am I.md`](./docs/Where%20Am%20I.md)

---

## License

MIT

---

*PM-06 · TripCanvas · Built as a Product Management portfolio case study*
