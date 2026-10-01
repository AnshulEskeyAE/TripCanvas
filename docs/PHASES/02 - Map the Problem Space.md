# PHASE 2 — PROBLEM SPACE MAPPING

## 1. PURPOSE
With the workflow mapped, the next step was listing all the plausible ways it breaks down — without picking a winner yet. This phase is a wide-angle view of failure modes, not a commitment to any one problem.

## 2. CORE QUESTION
What specifically goes wrong when a lead organizer tries to search, compare, budget, and align bookings across multiple travel websites?

## 3. INPUT
- Phase 0 Intake Brief ([00 - Start Here.md](00%20-%20Start%20Here.md)).
- Phase 1 System & Workflow Map ([01 - Understand the Context.md](01%20-%20Understand%20the%20Context.md)).
- User workflow diagrams showing information scattered across aggregators, OTAs, spreadsheets, and group chats.

![[Pasted image 20261001143754.png|700]]
---

## 4. WORK: THE PRE-BOOKING PROBLEM MAP (4 CORE FAILURE BRANCHES)

The lead organizer faces four major breakdowns before any booking is confirmed:

### Branch 1: The Connected Decisions Problem (One booking depends on another)
* **Symptom:** The organizer spends hours switching back and forth between tabs without booking anything.
* **Where it breaks:** They cannot book a flight without knowing hotel prices in that area; they cannot book a hotel without knowing if flight arrival times match check-in hours.
* **Why it happens:** Travel websites work in separate silos. Google Flights does not know where you want to stay, and Airbnb does not know what time your flight lands.
* **Impact:** High mental fatigue, analysis paralysis, and wasted hours.

### Branch 2: The Hidden Total Cost Problem (Budget surprises at checkout)
* **Symptom:** The organizer estimates the trip will cost $800, but final checkouts add up to $1,100+.
* **Where it breaks:** Individual searches only show headline prices. Hidden fees (cleaning fees, hotel resort charges, baggage costs, taxes) only appear on the final payment screens.
* **Why it happens:** There is no live "shopping basket" across different websites to track total trip spend against a fixed budget limit.
* **Impact:** Budget overruns, recalculating expenses midway, or having to restart the search for cheaper options.

### Branch 3: The Lost Tabs & Messy Notes Problem (Messy tracking of options)
* **Symptom:** "Where was that hotel link with the balcony I saw 20 minutes ago?"
* **Where it breaks:** The organizer copies links into Apple Notes or WhatsApp, losing track of key details like cancellation deadlines, room rules, or exact prices.
* **Why it happens:** Browsers are not built for side-by-side comparison across different booking sites.
* **Impact:** Losing good options, closing tabs by accident, and having to redo searches.

### Branch 4: The Waiting for Friends Problem (Prices rise while waiting for replies)
* **Symptom:** By the time friends reply "looks good!", the room is sold out or the flight price jumped.
* **Where it breaks:** Group chats are slow and asynchronous, but travel pricing and room availability change in real time.
* **Why it happens:** The organizer takes on all the search effort and financial risk, but co-travelers take hours or days to review options.
* **Impact:** Frustration, wasted research effort, and having to find second-best alternatives.

---

## 5. THINKING TASK: 5-WHYS DEEP DIVE ON PRE-BOOKING OVERLOAD

* **Observation:** The lead organizer feels exhausted juggling 15–25 browser tabs.
* **Why 1:** Why are they juggling tabs?  
  * *Because they are manually copying flight times, stay links, and prices into notes or spreadsheets.*
* **Why 2:** Why are they using spreadsheets?  
  * *Because no travel site lets them compare flights, stays, and total costs side by side.*
* **Why 3:** Why don't travel sites show this together?  
  * *Because each site (Google Flights, Airbnb, Booking.com) only wants you to complete their specific checkout.*
* **Why 4:** Why does the organizer need them together?  
  * *Because travel choices are connected: a cheap flight that lands at 11 PM might force an expensive late-night taxi or an extra night at a hotel.*
* **Why 5 (Root Cause):**  
  * *The organizer lacks a single place to evaluate trade-offs (Time + Location + Total Cost) across different vendors before paying.*

---

## 6. RESEARCH / ANALYSIS METHODS
- Reviewing personal booking experiences and peer workflows.
- Reading discussions on Reddit communities (r/travel, r/solotravel).
- Testing real booking scenarios across Google Flights, Airbnb, and Booking.com simultaneously.

## 7. OUTPUTS
- Pre-booking Failure Map (the 4 branches above).
- 5-Whys root cause analysis.

## 8. DECISION
**GO (GATE 2 CLEARED)** — The problem space is mapped widely into 4 distinct, competing failure branches without locking into a single narrow solution yet.

## 9. EXIT CRITERIA
We have a structured set of plausible failure modes clearly tied to the baseline workflow steps.

## 10. FAILURE CONDITIONS
Picking one feature (like "build an AI chatbot") without checking which of these 4 breakdowns actually causes the most pain for real users.

## 11. BACKTRACK CONDITIONS
If user research shows that organizers don't care about comparing options and prefer booking pre-packaged all-in-one vacation bundles.

## 12. AI ROLE
I used AI to format the failure branches and clean up the language in the 5-Whys analysis.

## 13. HUMAN ROLE
I identified the 4 failure modes, conducted the 5-Whys analysis, and mapped the problem space based on real human evidence.

## 14. COMMON FAILURE MODES
Confusing the symptom ("planning is stressful") with the actual operational breakdown ("prices and dates cannot be compared side by side").

## 15. NEXT PHASE
[PHASE 3 — PROBLEM DISCOVERY](03%20-%20Research%20%26%20Discovery.md)

## 16. STATUS
The four plausible failure branches are mapped. Phase 3 (Discovery) will test these against real trip organizers (interviews) to see which breakdown happens most frequently and causes the most headaches.
