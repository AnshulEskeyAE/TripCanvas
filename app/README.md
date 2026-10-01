# TripCanvas Web Application

The TripCanvas Web Application is the core hybrid workspace for comparing speculative travel options. It allows lead organizers to rapidly assemble, compare, and stress-test competing travel bundles side-by-side. 

By combining a structured data grid with a visual canvas, it automates true-basket cost calculations (including hidden drip fees) and detects spatio-temporal schedule conflicts, solving the primary pain points of the pre-booking travel phase.

## 🛠 Tech Stack

*   **Framework:** React + Vite
*   **State Management:** Zustand (with `persist` middleware for `localStorage` persistence)
*   **Styling:** Tailwind CSS + Radix UI / shadcn components
*   **Canvas Integration:** `@excalidraw/excalidraw` (Dynamically imported for performance)
*   **Routing / State Sharing:** URL Hash compression via `lz-string` (allows zero-install shareable states)
*   **Routing API (Conflicts):** OSRM (OpenStreetMap) via `router.project-osrm.org`

## 🏗 Architecture Highlights

### 1. The Interaction State Machine
The app operates around four global states:
1.  **Landing / Empty:** No active trip.
2.  **Blank Canvas:** Trip created; deck is empty.
3.  **Deck Populated & Partial Allocation:** Cards exist in the Unsorted Deck or partially in Plan A.
4.  **Full Comparison:** Both Plan A and Plan B bundles contain at least one transit and one stay. The true-basket math engines and conflict detection banners are actively computing trade-offs.

### 2. Spatio-Temporal Conflict Engine
The core value proposition of TripCanvas is identifying schedule gaps (e.g., landing at 9 AM, check-in at 3 PM). The app dynamically calculates these "stranded luggage" windows by geocoding transit data and pinging the OSRM transit routing API for driving durations between destinations.

### 3. Excalidraw Programmatic Generation
When the user clicks "Open in Visual Canvas", the app programmatically maps the structured data from Plan A and Plan B into an Excalidraw scene via the `updateScene()` API. This transitions the user from a strict tabular interface into a flexible, read-only whiteboard suitable for group sharing and consensus voting.

## 🚀 Development Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run the Development Server:**
   ```bash
   npm run dev
   ```

3. **Build for Production:**
   ```bash
   npm run build
   ```

The application uses standard `localStorage` to persist data, so you do not need any external databases or authentication providers to run it locally.
