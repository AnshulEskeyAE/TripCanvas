# PHASE 0 — INTAKE & FRAMING

## 1. PURPOSE
The starting question was deliberately broad: how do people plan and manage a trip? This phase narrowed it. Rather than investigating the whole travel lifecycle, I scoped down to the lead organizer's coordination work — specifically the window between "dates are set" and "bookings are done." The goal was to draw a fence around a real operational problem without yet assuming what was broken.

## 2. CORE QUESTION
How do lead organizers currently coordinate, book, and reconcile trip logistics once destination and dates are decided, and where does the manual coordination workflow break down?

## 3. INPUT
- Field observation of travel planning behaviors among peer groups and family.
- Deconstruction of existing products (TripIt, Wanderlog).
- Starter framing brief from [starter.md](../starter.md).

## 4. WORK
- **Target Actor:** The Lead Organizer / Primary Trip Planner.
- **Trigger Event:** Destination and travel dates are fixed; booking and budgeting begin.
- **Terminal Event:** All core bookings (transit, lodging, key activities) are confirmed and consolidated into an itinerary.
- **In Scope:**
  - Multi-item search, comparison, and selection across disparate vendors (flights, hotels/Airbnbs, trains).
  - Running budget estimation versus actual booking expenditure tracking.
  - Coordination and alignment of check-in/out windows, transit connections, and itineraries.
- **Strictly Out of Scope:**
  - Destination inspiration and discovery algorithms ("Where should we go?").
  - Date-finding / availability polling tools.
  - Building booking engine / Global Distribution System (GDS) integrations.
  - In-trip turn-by-turn navigation and live routing.

## 5. KEY OBSERVATION
- **Area:** Post-selection travel logistics, booking consolidation, and budget reconciliation for independent leisure trips.
- **Observation:** Once dates and destinations are fixed, lead organizers juggle 15–25 browser tabs across multiple booking platforms (airlines, hotels/Airbnb, activities) while manually copying details, prices, check-in times, and policies into spreadsheets or notes to reconcile costs and schedules.
- **Initial Hypothesis:** The primary bottleneck is not finding inventory (search engines and OTAs already do that well), but the manual overhead of *interdependent cross-vendor reconciliation*—balancing time-alignment, budget trade-offs, and booking statuses across disconnected vendors.
- **Problem:** (Deferred to Phase 5 — not declared yet).

## 6. RESEARCH / ANALYSIS METHODS
- Teardowns of current tooling (Wanderlog, TripIt, Google Sheets travel templates).
- Workflow mapping of real trip bookings.
- Qualitative interviews with experienced trip organizers.

## 7. OUTPUTS
- Framing Brief (this document).
- Explicit In-Scope and Out-of-Scope boundaries.

## 8. DECISION
**GO** — This area is tightly bounded, operationally observable, prototype-friendly without heavy API dependencies, and targets an acute workflow bottleneck.

## 9. EXIT CRITERIA
There is a clearly defined target actor (Lead Organizer), a distinct workflow trigger (dates/destination set), explicit non-goals, and an un-solutionized initial question.

## 10. FAILURE CONDITIONS
Allowing top-of-funnel discovery ("inspiration") or social collaboration features (voting/chat) to dilute the operational booking focus.

## 11. BACKTRACK CONDITIONS
If discovery research reveals that destination/date setting cannot be decoupled from booking availability in leisure travel.

## 12. AI ROLE
I used AI to help refine boundaries, challenge my early solution bias, and check the framing against PM standards.

## 13. HUMAN ROLE
I owned the scope definition, chose the target actor, and validated the boundaries against genuine user behavior.

## 14. COMMON FAILURE MODES
Prematurely declaring "the app needs a cleaner UI" or "we should build an AI trip planner" before understanding the current workflow.

## 15. NEXT PHASE
[PHASE 1 — AREA & CONTEXT UNDERSTANDING](01%20-%20Understand%20the%20Context.md)

## 16. SCOPE DECLARATION (GATE 0)
At the end of this phase, the investigation was formally scoped to: **post-selection travel logistics and booking coordination for lead trip organizers.** Starting observation: planners were juggling 15+ tabs and manually copy-pasting prices and dates into spreadsheets to manage tradeoffs. The explicit non-goals — inspiration engines, date polling, payment processing — were locked in before any research began.
