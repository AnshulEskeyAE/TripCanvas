# PHASE 6 — OPPORTUNITY & PRODUCT STRATEGY

## 1. PURPOSE
With the problem locked (the speculative comparison gap), I needed a product strategy to attack it. This phase was about deciding exactly where to compete and, more importantly, what NOT to build, to ensure we didn't accidentally just build another Wanderlog or Expedia.

## 2. CORE QUESTION
What should become different in the user's life, and why does that change matter?

## 3. INPUT
- Phase 5 Problem Statement ([05 - Define the Problem.md](05%20-%20Define%20the%20Problem.md)).
- Understanding of the true incumbent competitor: Google Sheets with pros/cons.

---

## 4. WORK: THE PRODUCT STRATEGY & THESIS

### Target User & Situation
- **User:** Independent leisure travelers acting as the Lead Organizer.
- **Situation:** Destination and dates are fixed; the organizer is actively searching, comparing, and budgeting flights and stays across multiple websites.

### The Desired Outcome (What Becomes Different?)
- **Today:** The organizer acts as "human middleware"—manually copy-pasting numbers into spreadsheets, estimating hidden fees with mental buffer margins, and juggling 15-25 tabs to check whether flight arrival times match hotel check-in hours.
- **Tomorrow:** The organizer can quickly assemble and compare candidate trip options side-by-side. True all-in basket costs (including fees) and schedule compatibility (arrival vs. check-in) are calculated automatically before any credit card is charged.

---

### The 3 Explicit Strategic Non-Goals

1. **Non-Goal 1: We will NOT become a booking engine or OTA.**  
   *Why:* We will not handle credit card processing, ticketing, or airline GDS integrations. When the user decides on an option, we simply hand them off via deep link to the merchant site.
2. **Non-Goal 2: We will NOT build an in-trip day-by-day itinerary scheduler.**  
   *Why:* Once bookings are confirmed, existing tools (Google Calendar, Apple Wallet, Wanderlog) work fine. Our focus stops at the transaction decision point.
3. **Non-Goal 3: We will NOT build top-of-funnel destination discovery or inspiration engines.**  
   *Why:* We do not tell users "where to go" or generate generic AI bucket lists. We only operate once destination and dates are already known.

---

### Core Product Principles

1. **Beat Google Sheets on Intelligence, Match it on Speed:** If adding an option requires more than 5 seconds of manual data entry, the user will abandon it and return to a blank spreadsheet.
2. **True Total Basket Visibility:** Never show a naked headline price. Always make hidden fees, taxes, and secondary transit costs explicit upfront.
3. **Speculative-First Design:** Support unfinished, tentative "what-if" bundles without demanding that bookings already be finalized.

---

### The Product Thesis
> *"If we provide lead organizers with a lightweight, speculative evaluation layer that captures travel options and automatically calculates total basket costs and schedule alignment, organizers will abandon manual spreadsheets, eliminate checkout budget surprises, and reduce pre-booking planning time by over 70%."*

---

## 5. KEY DECISION
The strategy was deliberate: win the speculative evaluation window specifically, not the whole travel planning lifecycle. Every non-goal exists to protect this. 

Before moving to architecture, I ruled out two broad product directions early: a booking aggregator (violates the OTA non-goal) and an AI itinerary generator (top-of-funnel, wrong moment). That left a lightweight "comparison workspace" as the most defensible wedge. A decision to add inspiration features or in-trip navigation would mean I had lost the thread.

## 6. RESEARCH / ANALYSIS METHODS
- Competitive wedge analysis against Google Sheets and Wanderlog.
- Trade-off analysis between speed vs. extreme customization.

## 7. OUTPUTS
- Strategy Document (this file).
- 3 Explicit Non-Goals.
- Core Product Thesis.

## 8. DECISION
**GO (GATE 6 CLEARED)** — The strategic thesis and non-goals are locked. We have clear guardrails preventing feature bloat.

## 9. EXIT CRITERIA
Clear product thesis and explicit non-goals established before any feature brainstorming begins.

## 10. FAILURE CONDITIONS
Describing specific UI elements or buttons instead of strategic trade-offs and guardrails.

## 11. BACKTRACK CONDITIONS
If technical discovery in Phase 7 reveals that side-by-side cross-vendor comparison is impossible without full API partnerships.

## 12. AI ROLE
I used AI as a devil's advocate against scope creep to test if my non-goals were strict enough.

## 13. HUMAN ROLE
I set the product strategy, defined the guardrails, and committed to saying "no" to secondary features.

## 14. COMMON FAILURE MODES
Trying to be everything to everyone (combining inspiration, booking, and itinerary management).

## 15. NEXT PHASE
[PHASE 7 — SOLUTION EXPLORATION](07%20-%20Explore%20Solutions.md)

## 16. STATUS
The product strategy is locked. Phase 7 will evaluate technical architectures (e.g., Extension vs. Web App) to figure out how to actually build this.
