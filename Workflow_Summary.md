# AmanEdge CRM — Full App Workflow Summary
## How Everything Works | End to End

---

## 🔵 THE BIG PICTURE

A Sales Rep gets assigned shops → goes there → checks in with GPS → logs the visit outcome → if a sale happens, records every detail → management sees everything live on the map, hierarchy by hierarchy.

---
---

## 📱 PART 1 — SALES REP DAILY WORKFLOW

---

### Step 1: Rep Opens the App & Starts the Day

```
Rep opens AmanEdge
        ↓
Taps "Start Day"
        ↓
GPS records current location + time
        ↓
System shows: TODAY'S ROUTE (list of shops to visit)
```

- The route is **pre-planned by the system** based on priority
- Rep sees: Shop Name, Area, Distance, Priority Level
- Each shop has **Latitude & Longitude** stored — this is how the system knows WHERE the shop is

---

### Step 2: Rep Gets Shop Information BEFORE Going

Before leaving for a shop, the rep can see the **full shop profile**:

```
┌─────────────────────────────────────┐
│  🏪  Rahman HARDWARE                │
│                                     │
│  📍 Territory: Territory A          │
│  📍 Area: Uttara, Dhaka             │
│  📍 GPS: 23.8715, 90.3985          │  ← Exact location on map
│                                     │
│  👤 Owner: Mr. Rahman, Age 52       │
│  📞 Phone: 01712-XXXXXX             │
│                                     │
│  📦 Monthly Sales: 45 tons          │
│  🏷️  Sells: AmanCem Advance,        │
│          AmanCem Basic              │
│  💰 Selling Price: Tk 520/bag       │
│  🏦 Credit: 30 days                 │
│  📊 Last Outcome: Progressive       │
│  ⚠️  Flag: No visit in 12 days      │
│                                     │
│  [📍 Navigate]  [👁️ Full Details]   │
└─────────────────────────────────────┘
```

**This is critical** — the rep knows everything about the shop BEFORE arriving.

---

### Step 3: Rep Navigates to the Shop

```
Rep taps "Navigate"
        ↓
Google Maps opens with the shop's exact GPS coordinates
        ↓
Rep travels to the shop location
```

- If the rep deviates too far from the planned route → **supervisor gets an alert**

---

### Step 4: Rep Arrives & Checks In (GPS Verified)

```
Rep arrives at shop
        ↓
Taps "Check In"
        ↓
System captures rep's CURRENT GPS location
        ↓
System compares:
  Rep's current location  vs  Shop's stored location
        ↓
  ✅ Within 200 meters? → CHECK-IN APPROVED
  ❌ Far away?          → "You are 850m away. Move closer."
```

**This prevents fake visits.** Speed check also runs — if the device says the rep is moving at 80 km/h, check-in is rejected.

---

### Step 5: Rep Has the Sales Conversation

The rep is armed with full shop data to pitch Aman Cement products.

---

### Step 6: Rep Logs the Visit Outcome (ONE TAP)

```
┌─────────────────────────────────┐
│                                 │
│   🟢 INTERESTED                 │  ← Shop wants to buy
│                                 │
│   🔵 PROGRESSIVE                │  ← Maybe next time
│                                 │
│   🔴 NOT INTERESTED             │  ← Not buying today
│                                 │
│   + Add a note (optional)       │
│   🎤 Voice memo (optional, 60s) │
│                                 │
└─────────────────────────────────┘
```

- **Interested** → If sale happens → Rep opens the **Record Sale** form (see Part 3)
- **Progressive** → System schedules follow-up in 2–3 days
- **Not Interested** → System deprioritizes. If 3 times in a row → flagged for review

---

### Step 7: Rep Ends the Day

```
Rep taps "End Day"
        ↓
System records: end location, end time, total distance
        ↓
Summary shown: X visits done, Y sales recorded, conversion summary
```

---
---

## ➕ PART 2 — ADDING A NEW SHOP (Sales Rep Input)

---

When a Sales Rep discovers a **new shop** not yet in the system, they add it on the spot.

---

### How It Starts

```
Rep finds a new shop/site
        ↓
Taps "+ Add New"
        ↓
System asks: WHAT TYPE?
        ↓
  🏪 Recurring Shop     ← Retailer / Dealer / Distributor
  🏗️  Project Customer   ← House / Building / Office site
        ↓
Form opens based on selection
```

---

### TYPE A — Adding a New RECURRING SHOP

#### SECTION 1: Basic Information

```
┌─────────────────────────────────────────────┐
│  NEW RECURRING SHOP                         │
│  ─────────────────────────────────────────  │
│                                             │
│  Shop Name *          [ Rahman Hardware ]   │  ← Rep types
│  Owner Name *         [ Mr. Abdur Rahman ]  │  ← Rep types
│  Owner Age *          [ 52 ]                │  ← Rep types
│  Phone Number *       [ 01712-345678 ]      │  ← Rep types
│                                             │
└─────────────────────────────────────────────┘
```

#### SECTION 2: Location (GPS + Area)

```
┌─────────────────────────────────────────────┐
│  LOCATION                                   │
│  ─────────────────────────────────────────  │
│                                             │
│  GPS Location *                             │
│    📍 Lat: 23.8715          ← AUTO captured │
│    📍 Lng: 90.3985          ← AUTO captured │
│                                             │
│    [📍 Pin Current Location]  ← Tap here    │
│    [🗺️  Pick on Map]          ← OR drag pin │
│                                             │
│  Area / Locality *    [ 🔍 Uttara, Dhaka ✓ ]│  ← Search & select
│  Territory            [ 🔵 Territory A ]    │  ← AUTO assigned
│                                             │
└─────────────────────────────────────────────┘
```

**Two GPS options:**
- **Pin Current Location** — rep is standing at the shop, system grabs GPS instantly
- **Pick on Map** — rep drags a pin on a mini Google Map to the exact spot

#### SECTION 3: Sales & Business Data

```
┌─────────────────────────────────────────────┐
│  SALES DATA                                 │
│  ─────────────────────────────────────────  │
│                                             │
│  Monthly Cement Sales (by brand) *          │
│    AmanCem Advance        [ 20 ] tons       │  ← Rep asks owner
│    AmanCem Advance Plus   [  0 ] tons       │     and types each
│    AmanCem Green          [  5 ] tons       │     brand's volume
│    AmanCem Basic          [ 15 ] tons       │
│    AmanCem Classic        [  5 ] tons       │
│                                             │
│  Selling Price (per bag) *                  │
│    AmanCem Advance        [ 520 ] Tk        │  ← Rep asks what
│    AmanCem Basic          [ 480 ] Tk        │     price shop charges
│    AmanCem Classic        [ 460 ] Tk        │
│                                             │
└─────────────────────────────────────────────┘
```

#### SECTION 4: Competitor & Preference Data

```
┌─────────────────────────────────────────────┐
│  BRAND & COMPETITOR INFO                    │
│  ─────────────────────────────────────────  │
│                                             │
│  Brand Preference Ranking *                 │
│  (Drag to reorder — #1 = most preferred)    │
│    ≡  1. AmanCem Advance                    │  ← Rep drags
│    ≡  2. AmanCem Basic                      │     brands into
│    ≡  3. AmanCem Classic                    │     order
│                                             │
│  Competitor Brands *                        │
│    ☑ Heidelberg Cement                      │  ← Rep ticks
│    ☐ BRAC Cement                            │     which ones
│    ☑ Bashundhara Cement                     │     the shop carries
│    ☐ Meghna Cement                          │
│    + Add other brand...                     │
│                                             │
└─────────────────────────────────────────────┘
```

#### SECTION 5: Storage & Credit

```
┌─────────────────────────────────────────────┐
│  STORAGE & CREDIT                           │
│  ─────────────────────────────────────────  │
│                                             │
│  Storage Capacity *       [ 80 ] tons       │  ← Rep estimates
│                                             │
│  Credit Practice *                          │
│    ○ Cash   — pays on delivery              │  ← Rep selects
│    ● Credit — pays after X days             │
│                                             │
│  Credit Days *            [ 30 ] days       │  ← Only if Credit
│                                             │
│  Offers / Promotions (last 6 months)        │
│    + Add promotion...                       │  ← Optional
│    • 10% off in Dec 2025                    │
│                                             │
└─────────────────────────────────────────────┘
```

#### Save → Shop appears on map as CIRCLE pin ●

---

### TYPE B — Adding a New PROJECT CUSTOMER

#### SECTION 1: Basic Information

```
  Project Name *         [ Rahman Residence ]   ← Rep types
  Owner Name *           [ Mr. Abdur Rahman ]   ← Rep types
  Phone Number *         [ 01812-654321 ]       ← Rep types
```

#### SECTION 2: Location — Same as Recurring (GPS + Area)

#### SECTION 3: Construction Details

```
┌─────────────────────────────────────────────┐
│  CONSTRUCTION DETAILS                       │
│  ─────────────────────────────────────────  │
│                                             │
│  Built-Up Area *          [ 1200 ] sqft     │  ← Rep measures/asks
│  Number of Floors *       [ 3 ]             │  ← Rep counts/asks
│  Structure Type *                           │
│    ● RCC      ○ Steel     ○ Mixed           │  ← Rep selects
│  Construction Stage *     [ 25 ] %          │  ← Rep estimates
│  Project Started *        ● Yes  ○ No       │  ← Rep selects
│  Current Brand            [ Heidelberg ]    │  ← Optional
│                                             │
└─────────────────────────────────────────────┘
```

#### SECTION 4: Auto-Calculated Cement Requirement

```
┌─────────────────────────────────────────────┐
│  📊 CEMENT REQUIREMENT (Auto-Calculated)    │
│  ─────────────────────────────────────────  │
│                                             │
│  Based on: 1200 sqft | 3 floors | RCC       │
│                                             │
│  ➜ Cement Required: 805.2 tons              │  ← System calculates
│    (includes 10% wastage buffer)            │     Rep does NOTHING
│                                             │
│  Cement Consumed So Far: [ 0 ] tons         │  ← Starts at 0
│                                             │     Updated each visit
└─────────────────────────────────────────────┘

Formula:
  RCC:   area × (0.25 + (floors-1) × 0.18) × 1.10
  Steel: area × 0.15 × floors × 1.10
  Mixed: area × 0.20 × floors × 1.10
```

#### Save → Project appears on map as DIAMOND pin ◆

---

### Quick Summary: Manual vs Automatic

```
✏️  REP TYPES IN:                    🤖 SYSTEM DOES AUTOMATICALLY:
─────────────────────────────────    ─────────────────────────────────
Shop/Project Name                    GPS Latitude & Longitude
Owner Name                           Territory Assignment
Owner Age (recurring)                Sales Rep ID
Phone Number                         Created Date & Time
Area / Locality                      Cement Requirement (project)
Monthly Sales per brand              Customer ID
Selling Price per brand              Marker on Map (instant)
Brand Preference Ranking             Supervisor Notification
Competitor Brands                    
Storage Capacity                     
Credit Practice & Days               
Construction details (project)       
```

---
---

## 💰 PART 3 — WHEN A SALE IS DONE (Sales Recording)

---

This is the **most important section**. When a shop actually agrees to buy Aman Cement, the rep records the full sale right there on the spot. Every field here flows up the hierarchy — every supervisor, manager, and director sees this data.

---

### How a Sale Gets Recorded

```
Rep is at the shop
        ↓
Shop owner says "Yes, I'll buy"
        ↓
Rep taps "Interested" as visit outcome
        ↓
A button appears: "💰 Record Sale"
        ↓
Rep taps it → Sale form opens
        ↓
Rep fills in all sale details
        ↓
Taps "CONFIRM SALE"
        ↓
Sale is live in the system instantly
        ↓
Supervisor + Manager see it on their dashboards
```

---

### THE SALE FORM — Every Field the Rep Must Fill

---

#### SECTION 1: Sale Identity (Auto + Manual)

```
┌─────────────────────────────────────────────────────┐
│  💰 RECORD NEW SALE                                 │
│  ───────────────────────────────────────────────    │
│                                                     │
│  Sale ID              [ ACM-2025-00847 ]            │  ← AUTO generated
│  Date & Time          [ 02 Feb 2025, 2:34 PM ]     │  ← AUTO (server)
│  Sales Rep            [ Karim Hossain ]             │  ← AUTO (logged-in)
│  Rep Territory        [ 🔵 Territory A ]            │  ← AUTO (from rep)
│                                                     │
│  Customer / Shop *    [ Rahman Hardware & Paint ]   │  ← AUTO (from check-in)
│  Customer Type        [ 🏪 Recurring ]              │  ← AUTO (from record)
│  Territory            [ 🔵 Territory A — Dhaka N ]  │  ← AUTO (from shop)
│  Area                 [ Uttara, Dhaka ]             │  ← AUTO (from shop)
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Field | Who Inputs | How |
|---|---|---|
| Sale ID | **System generates** | Unique code like ACM-2025-00847 |
| Date & Time | **System records** | Server timestamp at moment of save |
| Sales Rep Name | **System auto-fills** | From logged-in account |
| Rep Territory | **System auto-fills** | From rep's assigned territory |
| Customer Name | **System auto-fills** | From the shop that was checked in |
| Customer Type | **System auto-fills** | Recurring or Project |
| Shop Territory | **System auto-fills** | From shop's stored territory |
| Shop Area | **System auto-fills** | From shop's stored area |

> **Nothing in Section 1 is typed by the rep.** It's all automatic. The system knows WHO sold, WHERE, and WHEN.

---

#### SECTION 2: What Was Sold (Product Details)

```
┌─────────────────────────────────────────────────────┐
│  PRODUCT DETAILS                                    │
│  ───────────────────────────────────────────────    │
│                                                     │
│  Which Aman Cement product? *                       │
│  ┌───────────────────────────────────────────┐      │
│  │  ● AmanCem Advance                        │      │  ← Rep selects
│  │  ○ AmanCem Advance Plus                   │      │     which product
│  │  ○ AmanCem Green                          │      │     the shop bought
│  │  ○ AmanCem Basic                          │      │
│  │  ○ AmanCem Classic                        │      │
│  └───────────────────────────────────────────┘      │
│                                                     │
│  Quantity Sold *                                    │
│  ┌───────────────────────────────────────────┐      │
│  │  [ 25 ]  bags                             │      │  ← Rep types how
│  └───────────────────────────────────────────┘      │     many bags sold
│                                                     │
│  Unit Price (per bag) *                             │
│  ┌───────────────────────────────────────────┐      │
│  │  [ 520 ]  Tk / bag                        │      │  ← Rep types the
│  └───────────────────────────────────────────┘      │     agreed price
│                                                     │
│  Total Sale Value                                   │
│  ┌───────────────────────────────────────────┐      │
│  │  ➜ Tk 13,000                              │      │  ← AUTO calculated
│  │    (25 bags × Tk 520)                     │      │     qty × price
│  └───────────────────────────────────────────┘      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Field | Who Inputs | How | Required? |
|---|---|---|---|
| Product (Brand) | Rep selects | Single select from 5 Aman products | ✅ Yes |
| Quantity (bags) | Rep types | Number input | ✅ Yes |
| Unit Price (Tk/bag) | Rep types | Number input | ✅ Yes |
| Total Sale Value | **System calculates** | Quantity × Unit Price | ✅ Auto |

---

#### SECTION 3: Payment Details

```
┌─────────────────────────────────────────────────────┐
│  PAYMENT DETAILS                                    │
│  ───────────────────────────────────────────────    │
│                                                     │
│  Payment Type *                                     │
│  ┌───────────────────────────────────────────┐      │
│  │  ● Cash Payment                           │      │  ← Rep selects
│  │  ○ Credit Payment                         │      │     how the shop
│  │  ○ Partial (Cash + Credit)                │      │     will pay
│  └───────────────────────────────────────────┘      │
│                                                     │
│  ── If CASH: ─────────────────────────────          │
│  Cash Amount *            [ 13,000 ] Tk             │  ← Rep confirms amount
│                                                     │
│  ── If CREDIT: ───────────────────────────          │
│  Credit Amount *          [ 13,000 ] Tk             │  ← Rep types amount
│  Credit Days *            [ 30 ] days               │  ← How many days
│  Expected Payment Date    [ 04 Mar 2025 ]           │  ← AUTO calculated
│                                                     │     (today + credit days)
│                                                     │
│  ── If PARTIAL: ──────────────────────────          │
│  Cash Amount *            [ 5,000 ] Tk              │  ← Paid now
│  Credit Amount *          [ 8,000 ] Tk              │  ← Pay later
│  Credit Days *            [ 30 ] days               │
│  Expected Payment Date    [ 04 Mar 2025 ]           │  ← AUTO calculated
│                                                     │
│  Total = Cash + Credit    [ 13,000 ] Tk             │  ← Must match sale value
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Field | Who Inputs | How | Required? |
|---|---|---|---|
| Payment Type | Rep selects | Cash / Credit / Partial | ✅ Yes |
| Cash Amount | Rep types | Number (if Cash or Partial) | Conditional |
| Credit Amount | Rep types | Number (if Credit or Partial) | Conditional |
| Credit Days | Rep types | Number of days (if Credit or Partial) | Conditional |
| Expected Payment Date | **System calculates** | Today's date + Credit Days | ✅ Auto |

> **Validation rule:** Cash Amount + Credit Amount MUST equal Total Sale Value. System blocks save if they don't match.

---

#### SECTION 4: Delivery Details

```
┌─────────────────────────────────────────────────────┐
│  DELIVERY DETAILS                                   │
│  ───────────────────────────────────────────────    │
│                                                     │
│  Delivery Address *                                 │
│  ┌───────────────────────────────────────────┐      │
│  │  Rahman Hardware, Uttara, Dhaka           │      │  ← AUTO filled from
│  │  (same as shop address)                   │      │     shop record
│  │  [✏️ Edit if different]                   │      │  ← Rep can change
│  └───────────────────────────────────────────┘      │     if needed
│                                                     │
│  Delivery GPS                                       │
│  ┌───────────────────────────────────────────┐      │
│  │  📍 Lat: 23.8715  Lng: 90.3985           │      │  ← AUTO from shop
│  │  [📍 Change Location]                    │      │  ← Rep can update
│  └───────────────────────────────────────────┘      │
│                                                     │
│  Expected Delivery Date *                           │
│  ┌───────────────────────────────────────────┐      │
│  │  [ 04 Feb 2025 ]                          │      │  ← Rep selects date
│  └───────────────────────────────────────────┘      │     (date picker)
│                                                     │
│  Delivery Status *                                  │
│  ┌───────────────────────────────────────────┐      │
│  │  ● Pending                                │      │  ← Starts as Pending
│  │  ○ Dispatched                             │      │     Rep updates later
│  │  ○ Delivered                              │      │
│  └───────────────────────────────────────────┘      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Field | Who Inputs | How | Required? |
|---|---|---|---|
| Delivery Address | **Auto-filled** from shop | Rep can edit if different | ✅ Yes |
| Delivery GPS | **Auto-filled** from shop | Rep can change | ✅ Yes |
| Expected Delivery Date | Rep selects | Date picker | ✅ Yes |
| Delivery Status | Rep selects | Pending → Dispatched → Delivered | ✅ Yes |

---

#### SECTION 5: Notes & Confirmation

```
┌─────────────────────────────────────────────────────┐
│  NOTES & CONFIRMATION                               │
│  ───────────────────────────────────────────────    │
│                                                     │
│  Sale Notes (optional)                              │
│  ┌───────────────────────────────────────────┐      │
│  │  "Shop owner asked for 5 more bags next   │      │  ← Rep can add
│  │   week. Interested in AmanCem Green too."  │      │     any notes
│  └───────────────────────────────────────────┘      │
│                                                     │
│  ── SALE SUMMARY ─────────────────────────          │
│                                                     │
│  Product:        AmanCem Advance                    │
│  Quantity:       25 bags                            │
│  Unit Price:     Tk 520                             │
│  Total Value:    Tk 13,000                          │
│  Payment:        Cash — Tk 13,000                   │
│  Delivery:       04 Feb 2025 → Uttara, Dhaka       │
│  Shop:           Rahman Hardware & Paint            │
│  Territory:      🔵 Territory A                     │
│  Rep:            Karim Hossain                      │
│                                                     │
│  ┌───────────────────────────────────────────┐      │
│  │        ✅ CONFIRM SALE                    │      │  ← Final tap
│  └───────────────────────────────────────────┘      │     Sale is LIVE
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### For PROJECT Customers — Extra Fields

When the sale is at a **construction site** (not a shop), two extra fields appear:

```
┌─────────────────────────────────────────────────────┐
│  PROJECT UPDATE (appears for Project Customers)     │
│  ───────────────────────────────────────────────    │
│                                                     │
│  Construction Stage Update *                        │
│  ┌───────────────────────────────────────────┐      │
│  │  [ 40 ] %   (was 25% last visit)          │      │  ← Rep updates
│  └───────────────────────────────────────────┘      │     current progress
│                                                     │
│  Cement Consumed Update *                           │
│  ┌───────────────────────────────────────────┐      │
│  │  [ 120 ] tons  (total consumed so far)    │      │  ← Rep updates
│  └───────────────────────────────────────────┘      │     running total
│                                                     │
│  Remaining Cement Needed                            │
│  ┌───────────────────────────────────────────┐      │
│  │  ➜ 685.2 tons  (805.2 - 120)             │      │  ← AUTO calculated
│  └───────────────────────────────────────────┘      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### Complete Sale Fields Summary

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  🤖 AUTO (Rep does nothing):        ✏️  REP FILLS IN:        │
│  ──────────────────────────────     ──────────────────────   │
│  Sale ID                            Product (brand)           │
│  Date & Time                        Quantity (bags)           │
│  Sales Rep Name                     Unit Price (Tk/bag)       │
│  Rep Territory                      Payment Type              │
│  Customer Name                      Cash / Credit Amount      │
│  Customer Type                      Credit Days               │
│  Shop Territory                     Expected Delivery Date    │
│  Shop Area                          Delivery Status           │
│  Total Sale Value                   Sale Notes (optional)     │
│  Expected Payment Date              Construction % (project)  │
│  Delivery Address (default)         Cement Consumed (project) │
│  Delivery GPS (default)                                       │
│  Remaining Cement (project)                                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---
---

## 👁️ PART 4 — HIERARCHY VISIBILITY (Who Sees What)

---

This is how sales data flows **upward**. Every level sees more than the level below. Nothing is hidden from above. Everything is visible within your scope.

---

### THE HIERARCHY (Top to Bottom)

```
┌─────────────────────────────────────────────┐
│                                             │
│   👑  COUNTRY HEAD / C-SUITE                │  ← Sees EVERYTHING
│        (Bangladesh — All Territories)       │
│                  │                          │
│                  ▼                          │
│   📊  REGIONAL MANAGER                     │  ← Sees their Region
│        (e.g., Dhaka Region)                 │     (multiple territories)
│                  │                          │
│                  ▼                          │
│   📋  AREA MANAGER                         │  ← Sees their Area
│        (e.g., Dhaka North Area)             │     (group of territories)
│                  │                          │
│                  ▼                          │
│   👔  SUPERVISOR                           │  ← Sees their team only
│        (e.g., Territory A & B)              │     (2–3 territories)
│                  │                          │
│                  ▼                          │
│   📱  SALES REP                            │  ← Sees own territory only
│        (e.g., Territory A)                  │
│                                             │
└─────────────────────────────────────────────┘
```

---

### LEVEL 1 — SALES REP (Sees Only Their Own Territory)

```
┌──────────────────────────────────────────────────────┐
│  📱 SALES REP DASHBOARD — Karim Hossain              │
│  Territory: 🔵 Territory A (Dhaka North)             │
│  ────────────────────────────────────────────────    │
│                                                      │
│  MY SALES TODAY                                      │
│  ─────────────                                       │
│  ✅ Rahman Hardware     — 25 bags  — Tk 13,000       │
│  ✅ Kamal Cement Shop   — 40 bags  — Tk 20,800       │
│  ─────────────────────────────────────────           │
│  Total Sales Today:  2 sales | 65 bags | Tk 33,800   │
│                                                      │
│  MY PENDING DELIVERIES                               │
│  ─────────────────────                               │
│  📦 Rahman Hardware   — Due: 04 Feb — Pending        │
│  📦 Kamal Cement      — Due: 03 Feb — Dispatched    │
│                                                      │
│  MY PENDING PAYMENTS                                 │
│  ────────────────────                                │
│  💳 Sultana Traders   — Tk 8,200 — Due: 10 Feb      │
│                                                      │
│  MY ROUTE TODAY                                      │
│  ──────────────                                      │
│  ● Rahman Hardware     ✅ Done (Sale recorded)       │
│  ● Kamal Cement Shop   ✅ Done (Sale recorded)       │
│  ● Sultana Traders     🔵 Pending visit              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Sales Rep sees:**
- Only their OWN sales (today + this week + this month)
- Only their OWN pending deliveries
- Only their OWN pending payments from customers
- Only shops inside their territory
- Their own route and visit status

---

### LEVEL 2 — SUPERVISOR (Sees Their Team's Territories)

```
┌──────────────────────────────────────────────────────┐
│  👔 SUPERVISOR DASHBOARD — Mr. Alam                  │
│  Team: Territory A + Territory B                     │
│  ────────────────────────────────────────────────    │
│                                                      │
│  TEAM SALES TODAY                                    │
│  ─────────────────                                   │
│  Rep Name      Sales    Bags     Value               │
│  ──────────────────────────────────────              │
│  Karim         2        65       Tk 33,800           │
│  Rashid        1        30       Tk 15,600           │
│  Farhan        3        90       Tk 46,800           │
│  Suman         0        0        Tk 0          ⚠️    │  ← No sales today
│  ──────────────────────────────────────              │
│  TEAM TOTAL:   6 sales  185 bags  Tk 96,200          │
│                                                      │
│  TERRITORY COMPARISON                                │
│  ────────────────────                                │
│  🔵 Territory A   →  3 sales  | Tk 49,400           │
│  🔴 Territory B   →  3 sales  | Tk 46,800           │
│                                                      │
│  PENDING DELIVERIES (All Reps)                       │
│  ─────────────────────────────                       │
│  📦 Rahman Hardware (Karim)     — Due: 04 Feb        │
│  📦 Kamal Cement   (Karim)     — Due: 03 Feb        │
│  📦 Bashir Trading (Farhan)    — Due: 05 Feb        │
│                                                      │
│  PENDING PAYMENTS (All Reps)                         │
│  ────────────────────────────                        │
│  💳 Sultana Traders (Karim)    — Tk 8,200 — 10 Feb  │
│  💳 Rafiq Dealers   (Rashid)   — Tk 12,000 — 08 Feb │
│                                                      │
│  CONVERSION LEAKS                                    │
│  ────────────────                                    │
│  ⚠️ Suman — 0 sales this week. 4 visits done.       │
│  ⚠️ Rahman Hardware — Interested 3 times, no order   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Supervisor sees:**
- All sales from ALL reps in their team (Territory A + Territory B)
- Which rep sold what, how much, to which shop
- Territory-by-territory comparison of sales performance
- All pending deliveries across the team
- All pending payments across the team
- Conversion leaks — reps who visited but didn't sell

---

### LEVEL 3 — AREA MANAGER (Sees Multiple Supervisor Teams)

```
┌──────────────────────────────────────────────────────┐
│  📋 AREA MANAGER DASHBOARD — Mr. Hasan               │
│  Area: Dhaka North (Territory A + B + C)             │
│  ────────────────────────────────────────────────    │
│                                                      │
│  AREA SALES SUMMARY — Today                          │
│  ──────────────────────────────                      │
│  Territory      Sales   Bags     Value     Conversion│
│  ──────────────────────────────────────────────      │
│  🔵 Terr A      6       185      Tk 96,200    62%   │
│  🔴 Terr B      4       120      Tk 62,400    48%   │  ← Lower — flag
│  🟢 Terr C      8       240      Tk 124,800   71%   │
│  ──────────────────────────────────────────────      │
│  AREA TOTAL:    18 sales  545 bags  Tk 283,400       │
│                                                      │
│  SUPERVISOR COMPARISON                               │
│  ─────────────────────                               │
│  Mr. Alam  (Terr A+B)  → Tk 158,600  | 10 sales    │
│  Mr. Islam (Terr C)    → Tk 124,800  |  8 sales    │
│                                                      │
│  SALES BY PRODUCT (Area-wide)                        │
│  ─────────────────────────────                       │
│  AmanCem Advance       → 320 bags  — Tk 166,400     │
│  AmanCem Basic         → 150 bags  — Tk 72,000      │
│  AmanCem Classic       →  75 bags  — Tk 34,500      │
│  AmanCem Green         →  0 bags   — Tk 0     ⚠️    │  ← Not selling
│                                                      │
│  DELIVERY STATUS (Area-wide)                         │
│  ────────────────────────────                        │
│  📦 Pending:     8 deliveries                        │
│  📦 Dispatched:  5 deliveries                        │
│  📦 Delivered:  12 deliveries                        │
│                                                      │
│  PAYMENT STATUS (Area-wide)                          │
│  ────────────────────────────                        │
│  💳 On Time:     14 payments                         │
│  💳 Overdue:      3 payments  ⚠️                     │  ← Flag
│  💳 Pending:      6 payments                         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Area Manager sees:**
- Sales grouped by territory within their area
- Supervisor-vs-supervisor comparison
- Product-wise breakdown (which Aman product sells most)
- Delivery status across all territories in the area
- Payment health — on time vs overdue vs pending
- Conversion rate per territory

---

### LEVEL 4 — REGIONAL MANAGER (Sees Multiple Areas)

```
┌──────────────────────────────────────────────────────┐
│  📊 REGIONAL MANAGER DASHBOARD — Mr. Rafiq           │
│  Region: Dhaka (North Area + South Area + East Area) │
│  ────────────────────────────────────────────────    │
│                                                      │
│  REGION SALES SUMMARY — This Month                   │
│  ──────────────────────────────────                  │
│  Area            Sales   Bags      Value    Target   │
│  ──────────────────────────────────────────────      │
│  Dhaka North     320     9,400     Tk 4.88M   ✅     │  ← Hit target
│  Dhaka South     280     8,200     Tk 4.26M   🟠     │  ← 85% of target
│  Dhaka East      195     5,700     Tk 2.96M   🔴     │  ← 68% of target
│  ──────────────────────────────────────────────      │
│  REGION TOTAL:   795 sales  23,300 bags  Tk 12.1M    │
│  Region Target:  Tk 14.5M  →  83% achieved  🟠      │
│                                                      │
│  GOOGLE MAP VIEW                                     │
│  ───────────────                                     │
│  🗺️  Full map showing:                               │
│     • All territories in Dhaka Region (colored)      │
│     • Sales heatmap overlay                          │
│     • Territory performance color-coding:            │
│         🟢 Green zone = above target                 │
│         🟠 Amber zone = 70–99% of target             │
│         🔴 Red zone = below 70% of target            │
│                                                      │
│  TOP PERFORMERS (Reps)                               │
│  ──────────────────────                              │
│  1. Farhan (Terr C)   — 42 sales  Tk 218,400       │
│  2. Karim  (Terr A)   — 38 sales  Tk 197,600       │
│  3. Islam  (Terr D)   — 35 sales  Tk 182,000       │
│                                                      │
│  UNDERPERFORMERS                                     │
│  ───────────────                                     │
│  ⚠️ Suman  (Terr B)   — 12 sales  Tk 62,400        │
│  ⚠️ Shakir (Terr E)   — 9 sales   Tk 46,800        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Regional Manager sees:**
- Sales by area with target vs actual comparison
- Google Map with performance color zones
- Rep-level top performers and underperformers
- Region-wide target achievement percentage
- Monthly trend and forecasting

---

### LEVEL 5 — COUNTRY HEAD / C-SUITE (Sees Everything)

```
┌──────────────────────────────────────────────────────┐
│  👑 COUNTRY HEAD DASHBOARD                           │
│  Aman Cement Mills Ltd. — Bangladesh (All Regions)   │
│  ────────────────────────────────────────────────    │
│                                                      │
│  NATIONAL SALES SUMMARY — This Month                 │
│  ──────────────────────────────────────              │
│  Region        Sales    Bags       Value     Target  │
│  ─────────────────────────────────────────────       │
│  Dhaka         795      23,300     Tk 12.1M   🟠     │
│  Chittagong    620      18,100     Tk 9.4M    ✅     │
│  Rajshahi      380      11,200     Tk 5.8M    🔴     │
│  Sylhet        290       8,500     Tk 4.4M    ✅     │
│  Khulna        410      12,000     Tk 6.2M    🟠     │
│  ─────────────────────────────────────────────       │
│  NATIONAL TOTAL: 2,495 sales  73,100 bags  Tk 37.9M │
│  National Target: Tk 42M  →  90% achieved  🟠       │
│                                                      │
│  📊 GOOGLE MAP — BANGLADESH FULL VIEW                │
│  ────────────────────────────────                    │
│  • All territories visible (color-coded)             │
│  • Performance heatmap overlaid                      │
│  • Live rep positions visible                        │
│  • Click any territory → drill down to details       │
│                                                      │
│  PRODUCT PERFORMANCE (National)                      │
│  ──────────────────────────────                      │
│  AmanCem Advance       → 38,400 bags  Tk 19.97M    │  ← Top seller
│  AmanCem Basic         → 18,200 bags  Tk 8.74M     │
│  AmanCem Classic       → 9,800 bags   Tk 4.51M     │
│  AmanCem Green         → 4,500 bags   Tk 2.34M     │  ← Needs push
│  AmanCem Advance Plus  → 2,200 bags   Tk 1.14M     │  ← Needs push
│                                                      │
│  PAYMENT HEALTH (National)                           │
│  ─────────────────────────                           │
│  💳 Total Outstanding:   Tk 4.2M                     │
│  💳 Overdue (>30 days):  Tk 680K   ⚠️               │
│  💳 Due This Week:       Tk 1.1M                     │
│                                                      │
│  DELIVERY HEALTH (National)                          │
│  ─────────────────────────                           │
│  📦 On Time:      94%                                │
│  📦 Delayed:       6%   ⚠️                           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Country Head sees:**
- Full national picture — every region, every territory
- Target vs actual for the entire country
- Product-wise national performance
- Payment health — total outstanding, overdue amounts
- Delivery health — on-time percentage nationwide
- Google Map of all Bangladesh with performance overlay
- Can drill down: Country → Region → Area → Territory → Rep → Individual Sale

---

### VISIBILITY SUMMARY TABLE

```
┌─────────────────────┬────────┬────────┬────────┬────────┬────────┐
│                     │  Rep   │  Sup.  │ Area   │Region  │Country │
│  WHAT THEY SEE      │        │        │  Mgr   │  Mgr   │  Head  │
├─────────────────────┼────────┼────────┼────────┼────────┼────────┤
│ Own sales only      │   ✅   │        │        │        │        │
│ Team sales          │        │   ✅   │        │        │        │
│ Area sales          │        │        │   ✅   │        │        │
│ Region sales        │        │        │        │   ✅   │        │
│ All national sales  │        │        │        │        │   ✅   │
├─────────────────────┼────────┼────────┼────────┼────────┼────────┤
│ Own territory map   │   ✅   │        │        │        │        │
│ Team territory maps │        │   ✅   │        │        │        │
│ Area territory maps │        │        │   ✅   │        │        │
│ Region map          │        │        │        │   ✅   │        │
│ Full Bangladesh map │        │        │        │        │   ✅   │
├─────────────────────┼────────┼────────┼────────┼────────┼────────┤
│ Own deliveries      │   ✅   │        │        │        │        │
│ Team deliveries     │        │   ✅   │        │        │        │
│ Area deliveries     │        │        │   ✅   │        │        │
│ All deliveries      │        │        │        │   ✅   │   ✅   │
├─────────────────────┼────────┼────────┼────────┼────────┼────────┤
│ Own payments        │   ✅   │        │        │        │        │
│ Team payments       │        │   ✅   │        │        │        │
│ Area payments       │        │        │   ✅   │        │        │
│ All payments        │        │        │        │   ✅   │   ✅   │
├─────────────────────┼────────┼────────┼────────┼────────┼────────┤
│ Target vs Actual    │  Own   │  Team  │  Area  │Region  │National│
│ Product breakdown   │        │        │   ✅   │   ✅   │   ✅   │
│ Rep performance     │        │   ✅   │   ✅   │   ✅   │   ✅   │
│ Conversion leaks    │        │   ✅   │   ✅   │   ✅   │   ✅   │
│ Heatmap overlay     │        │        │        │   ✅   │   ✅   │
│ Live rep positions  │        │   ✅   │   ✅   │   ✅   │   ✅   │
└─────────────────────┴────────┴────────┴────────┴────────┴────────┘
```

---
---

## 🔄 PART 5 — HOW SALES DATA FLOWS UP THE HIERARCHY

---

```
  Rep records sale at the shop
        ↓
  ┌────────────────────────────────┐
  │  SALE SAVED TO DATABASE        │
  │  • Sale ID, Product, Qty       │
  │  • Price, Payment, Delivery    │
  │  • Shop, Territory, Rep        │
  └────────────┬───────────────────┘
               │
       ────────┼────────────────────────
       │       │       │       │       │
       ▼       ▼       ▼       ▼       ▼
  ┌────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐
  │  REP   │ │ SUP. │ │ AREA │ │REG.  │ │COUNTRY │
  │ sees   │ │ sees │ │ MGR  │ │ MGR  │ │ HEAD   │
  │ own    │ │ team │ │ sees │ │ sees │ │ sees   │
  │ sale   │ │ sale │ │ area │ │reg.  │ │ all    │
  └────────┘ └──────┘ └──────┘ └──────┘ └────────┘

  Same sale. Same data. Different SCOPE.
  Each level sees MORE than the one below.
  Nothing is hidden from above.
```

---
---

## 🏗️ PART 6 — PROJECT CUSTOMERS LIFECYCLE

---

```
House Owner found
        ↓
Rep adds as Project Customer (Part 2)
        ↓
System AUTO-CALCULATES cement needed (805.2 tons)
        ↓
Rep visits → records sales → updates consumption
        ↓
Rep tracks: construction stage % each visit
        ↓
When construction = 100% OR cement consumed = requirement:
        ↓
Customer AUTO-ARCHIVES
        ↓
Data kept forever for reports
```

**Example:**
- House: 1200 sqft, 3 floors, RCC → System says: 805.2 tons needed
- Visit 1: Rep sells 120 tons → Consumed: 120 / 805.2
- Visit 2: Rep sells 150 tons → Consumed: 270 / 805.2
- ... continues until 805.2 tons consumed → **Auto-archived**

---
---

## ⚡ PART 7 — KEY NUMBERS AT A GLANCE

---

| What | How It Works |
|---|---|
| **GPS Check-in Range** | Must be within **200 meters** of the shop |
| **Speed Check** | Rejects check-in if moving faster than **60 km/h** |
| **Visit Outcome** | Exactly **1 tap** — Interested / Progressive / Not Interested |
| **Sale Recording** | Opens after "Interested" tap — rep fills product, qty, price, payment, delivery |
| **Total Value Calc** | **Auto** — system multiplies Quantity × Unit Price |
| **Payment Validation** | Cash + Credit amounts **must equal** Total Sale Value |
| **Expected Payment Date** | **Auto** — today + credit days |
| **Delivery Address** | **Auto-filled** from shop GPS — rep can edit if different |
| **Stagnation Flag** | No visit in **14 days** → Orange warning |
| **Dead Zone Alert** | Territory with **0 visits in 7 days** → Red flag |
| **Route Deviation Alert** | Rep moves **500m off** planned route → Supervisor notified |
| **Auto-Archive Trigger** | Construction **100% complete** OR cement requirement **fully consumed** |
| **Live Location Ping** | Every **60 seconds** during working hours |
| **Hierarchy Access** | Each role sees ONLY their scope — Rep=own, Sup=team, Area=area, Regional=region, Country=all |

---

*AmanEdge CRM — Aman Cement Mills Ltd.*
