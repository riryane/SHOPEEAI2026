# 🚀 Hackathon Proposal: Shopee Express AI-Powered Delivery Risk Scoring & Rider Optimization System

## 🎯 Thesis Statement
To practically improve Shopee’s delivery efficiency within a hackathon timeframe, we will integrate an **LLM AI API scoring system** that flags high-risk delivery addresses at checkout, prioritizes real-time rider verification prompts for ambiguous locations, and provides a front-end dashboard predicting optimal customer delivery windows.

---

## 🏛️ Strategic Pillars & Technical Scope

### Major Point 1: Predictive Delivery Success Probability Engine (24-Hour MVP)
- **Objective**: Deploy a lightweight, fast classification engine (XGBoost / Random Forest + Address Rules) that processes incoming delivery orders at checkout using existing operational data.
- **Functionality**: Calculates a real-time **Delivery Success Probability Score (0 - 100%)** and flags high-risk parcels (e.g., `hub backlog`, `routing delay`, `customer not available`) **before** dispatch from the fulfillment hub.
- **Backend API**: Exposes a REST endpoint `/api/v1/score-delivery` consuming Supabase `parcel_history` and `hub_daily_operations` records.

### Major Point 2: Rapid Data Pipeline & Edge-Case Handling
- **Challenge**: Overcoming unstructured text addresses, missing landmarks, and edge cases where address quality is high but customer COD availability is low.
- **Strategy**: 
  - Standardize text parsing via Regex + Levenshtein distance metrics on existing parcel data.
  - Combine spatial/zone features (`origin_zone` -> `destination_zone`) with historic customer behavioral metrics (`attempt_count`, `service_type`, `was_late`).
  - Pre-calculate risk buckets (`LOW_RISK`, `HIGH_RISK`) stored directly in Supabase for sub-50ms queries.

### Major Point 3: Rider App Integration & Automated Pre-Verification
- **Prototyping Strategy**: Seamlessly display risk scores and warning badges (`HIGH RISK`, `Hub Backlog Risk`, `Routing Delay`) directly inside our built Shopee Express Rider App (`dashboard.html` & `details.html`).
- **Rider Workflow**: Triggers automated SMS / verification prompts to high-risk customers prior to rider dispatch, ensuring customer availability and drastically reducing costly last-mile re-deliveries.

---

## 👥 Demo Case Study: 1 Driver & 4 Exact Parcels Extracted From Dataset

To prove end-to-end functionality to hackathon judges, our demo uses **1 Driver Workload** and **4 Exact Historical Parcels** extracted directly from `parcel_history` and `hub_daily_operations` in Supabase:

### 🛵 Assigned Driver Workload Context:
- **Hub**: `HUB_A_NORTH` (Metro North Urban Hub)
- **Rider Allocation**: 15 Active Riders handling 45 parcels/day (Workload: ~22 parcels/rider)

### 📦 4 Test Parcels (Extracted Verbatim from `parcel_history`):

| Parcel ID | Hub ID | Destination | Service Type | Seller Segment | Outcome | Failure Reason / Status | Risk Level | ML Score | Triggered Action |
|---|---|---|---|---|---|---|---|---|---|
| `P0000001` | `HUB_A_NORTH` | Metro | Economy | Marketplace | `delivered_on_time` | Delivered (Attempt 1) | 🟢 **LOW RISK** | **94%** | Standard Dispatch |
| `P0000003` | `HUB_A_NORTH` | Metro | Standard | Enterprise | `delivered_on_time` | Delivered (Attempt 1) | 🟢 **LOW RISK** | **98%** | Standard Dispatch |
| `P0000012` | `HUB_A_NORTH` | Metro | Standard | Marketplace | `failed` | `hub backlog` | 🔴 **HIGH RISK** | **24%** | Priority Sorting Prompt |
| `P0000014` | `HUB_A_NORTH` | Metro | Standard | Direct Seller | `failed` | `routing delay` (3 attempts) | 🔴 **HIGH RISK** | **18%** | Route Verification & Call Prompt |

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
[ Shopee Express Rider App (HTML5/CSS3/JS) ]          - cost_inputs / solution_menu
  ├── dashboard.html (Parcel List & Filters)
  ├── details.html (High Risk Badges & Optimal Timing)
  ├── status.html (Choose Outcome)
  └── reason.html (Failure Analysis & AI Feedback)
```
