# 🚀 Hackathon Proposal: Shopee Express AI-Powered Delivery Risk Scoring & Rider Optimization System

## 🎯 Thesis Statement
To practically improve Shopee’s delivery efficiency within a hackathon timeframe, we will integrate an **LLM AI API scoring system** that flags high-risk delivery addresses at checkout, prioritizes real-time rider verification prompts for ambiguous locations, and provides a front-end dashboard predicting optimal customer delivery windows.

---

## 🏛️ Strategic Pillars & Technical Scope

### Major Point 1: Predictive Delivery Success Probability Engine (24-Hour MVP)
- **Objective**: Deploy a lightweight, fast classification engine (XGBoost / Random Forest + Address Rules) that processes incoming delivery orders at checkout using existing operational data in Supabase.
- **Functionality**: Calculates a real-time **Delivery Success Probability Score (0 - 100%)** and flags high-risk parcels (e.g., `hub backlog`, `routing delay`, `customer not available`) **before** dispatch from the fulfillment hub.
- **Backend API**: Exposes a REST endpoint `/api/v1/score-delivery` consuming Supabase `parcel_history` (11,999 rows) and `hub_daily_operations` (252 rows) records for model training.

### Major Point 2: Rapid Data Pipeline & Edge-Case Handling
- **Challenge**: Overcoming unstructured text addresses, missing landmarks, and edge cases where address quality is high but customer COD availability is low.
- **Strategy**: 
  - Standardize text parsing via Regex + Levenshtein distance metrics on historical customer drop-offs.
  - Combine spatial/zone features (`origin_zone` -> `destination_zone`) with customer payment metrics (`COD` vs `PREPAID`, attempt count, past failures).
  - Pre-calculate risk buckets (`LOW_RISK`, `MEDIUM_RISK`, `HIGH_RISK`) for sub-50ms query response.

### Major Point 3: Rider App Integration & Automated Pre-Verification
- **Prototyping Strategy**: Hardcoded 1 Rider frontend interface displaying 4 Customer Delivery Scenarios (2 Good History, 2 Bad/High-Risk History).
- **Rider Workflow**: Displays risk scores and warning badges (`HIGH RISK`, `Missing unit number`, `GPS Mismatch`) directly on `dashboard.html` and `details.html`. Triggers automated SMS / verification prompts to high-risk customers prior to rider dispatch.

---

## 👥 Demo Case Study Architecture: 1 Rider & 4 Customer Profiles

### 🛵 Assigned Front-End Rider:
- **Rider**: **Rider Juan** (Hardcoded 1 Rider view in `dashboard.html`)
- **Hub**: `HUB_A_NORTH` (Cainta, Rizal)

### 📦 4 Customer Test Scenarios (Displayed in Rider App):

| Customer ID | Name | Payment | Address & Notes | Delivery History | Risk Level | ML Score | Triggered Action |
|---|---|---|---|---|---|---|---|
| `CUST_001` | **Juan Dela Cruz** | COD (₱245.00) | Blk 4 Lot 12, Brgy. San Isidro, Cainta, Rizal | 12 Successful / 0 Failed | 🟢 **LOW RISK** | **94%** | Standard Dispatch |
| `CUST_002` | **Maria Santos** | PREPAID | 123 Mabini St., Brgy. Mabini, Cainta, Rizal | 18 Successful / 0 Failed | 🟢 **LOW RISK** | **98%** | Standard Dispatch |
| `CUST_003` | **Alex Reyes** | COD (₱560.00) | 28 Sunrise St., Brgy. San Isidro, Cainta, Rizal | 1 Successful / 3 Failed (COD Unavailable) | 🔴 **HIGH RISK** | **22%** | SMS Pre-Verification & Call Prompt |
| `CUST_004` | **Mark Bautista** | PREPAID | 91 East Rd., Brgy. Sta. Clara, Cainta, Rizal | 2 Successful / 2 Failed (Bad Address / No Unit) | 🟡 **MEDIUM RISK** | **45%** | Address Unit Verification Prompt |

---

## 📊 Financial Impact & ROI Model (Based on Dataset Assumptions)

| Metric | Benchmark Assumption | Impact with AI Risk Engine | Projected Monthly Savings |
|---|---|---|---|
| **Failed Delivery Cost** | ₱72 / failed parcel | 35% reduction in first-attempt failures | **₱181,440 / month** |
| **Redelivery Retry Cost** | ₱54 / redelivery | 40% reduction in unnecessary retries | **₱116,640 / month** |
| **Late Delivery Penalty** | ₱28 / late parcel | 25% decrease in backlog delay | **₱50,400 / month** |
| **Total Estimated Net Value** | - | **Combined Efficiency Lift** | **~ ₱348,480 / month** |

---

## 🛠️ Tech Stack & Architecture

```
[ Customer Checkout / Mobile App ] 
             │
             ▼
[ ML Risk Scoring Engine (XGBoost / FastAPI) ] ◄──► [ Supabase PostgreSQL DB ]
             │                                        - parcel_history (11,999 rows)
             ▼                                        - hub_daily_operations (252 rows)
[ Shopee Express Rider App (1 Hardcoded Rider View) ] - cost_inputs / solution_menu
  ├── dashboard.html (4 Customer Delivery List: 2 Good / 2 Bad History)
  ├── details.html (High Risk Badges & Optimal Timing)
  ├── status.html (Choose Outcome)
  └── reason.html (Failure Analysis & AI Feedback)
```
