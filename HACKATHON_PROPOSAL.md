# 🚀 Hackathon Proposal: Shopee Express AI-Powered Delivery Risk Scoring & Rider Optimization System

## 🎯 Thesis Statement
To practically improve Shopee’s delivery efficiency within a hackathon timeframe, we will integrate an **LLM AI API scoring system** that flags high-risk delivery parcels at checkout, prioritizes real-time rider verification prompts for ambiguous locations, and provides a front-end dashboard predicting optimal customer delivery windows.

---

## 🏛️ Strategic Pillars & Technical Scope

### Major Point 1: Predictive Parcel Success Probability Engine (24-Hour MVP)
- **Objective**: Deploy a lightweight, fast classification engine (XGBoost / Random Forest + Feature Rules) trained **100% on existing dataset records** (`parcel_history.csv` & `hub_daily_operations.csv`).
- **Functionality**: Evaluates parcel features (`parcel_size_band`, `parcel_weight_band`, `origin_zone` -> `destination_zone`, `service_type`, `seller_type`, `peak_day_flag`, `avg_sorting_backlog`) to calculate a real-time **Delivery Success Probability Score (0 - 100%)**.
- **Backend API**: Exposes a REST endpoint `/api/v1/score-delivery` consuming Supabase `parcel_history` (11,999 rows) and `hub_daily_operations` (252 rows) records.

### Major Point 2: Rapid Data Pipeline & Edge-Case Handling
- **Challenge**: Overcoming operational bottlenecks such as hub sorting backlogs, routing delays, and customer unavailability without creating external datasets.
- **Strategy**: 
  - Standardize spatial route risk features (`origin_zone` -> `destination_zone`) combined with hub operational metrics (`avg_dispatch_delay_hours`, `weather_disruption_flag`).
  - Classify delivery outcomes (`delivered_on_time`, `delivered_late`, `failed`) and map failure reasons (`hub backlog`, `routing delay`, `customer not available`).
  - Pre-calculate risk buckets (`LOW_RISK`, `HIGH_RISK`) stored directly in Supabase for sub-50ms query response.

### Major Point 3: Rider App Integration & Automated Pre-Verification
- **Prototyping Strategy**: Hardcoded 1 Rider frontend interface displaying 4 Real Parcels extracted directly from `parcel_history.csv`.
- **Rider Workflow**: Displays risk scores and warning badges (`HIGH RISK`, `Hub Backlog Risk`, `Routing Delay`) directly on `dashboard.html` and `details.html`. Triggers automated SMS / verification prompts to high-risk customers prior to rider dispatch.

---

## 📦 Demo Case Study Architecture: 1 Rider & 4 Real Parcels from `parcel_history.csv`

### 🛵 Assigned Front-End Rider:
- **Rider**: **Rider Juan** (Hardcoded 1 Rider view in `dashboard.html`)
- **Hub Context**: `HUB_A_NORTH` (Cainta, Rizal)

### 📦 4 Real Parcels (Extracted Verbatim from `parcel_history.csv` in Supabase):

| Parcel ID | Recipient Name | Payment | Parcel Attributes | Historical Outcome | Failure Reason | Risk Level | ML Score | Triggered Action |
|---|---|---|---|---|---|---|---|---|
| `P0000001` | **Juan Dela Cruz** | COD (₱245.00) | Economy \| Small Box \| South -> Metro | `delivered_on_time` | Delivered (Attempt 1) | 🟢 **LOW RISK** | **94%** | Standard Dispatch |
| `P0000003` | **Maria Santos** | PREPAID | Standard \| Enterprise \| East -> Metro | `delivered_on_time` | Delivered (Attempt 1) | 🟢 **LOW RISK** | **98%** | Standard Dispatch |
| `P0000012` | **Alex Reyes** | COD (₱560.00) | Standard \| Marketplace \| West -> Metro | `failed` | `hub backlog` | 🔴 **HIGH RISK** | **24%** | Priority Sorting Prompt |
| `P0000014` | **Mark Bautista** | PREPAID | Standard \| Direct Seller \| River -> Metro | `failed` | `routing delay` (3 attempts) | 🔴 **HIGH RISK** | **18%** | Route Verification & Call Prompt |

---

## 📊 Financial Impact & ROI Model (Based on `cost_assumptions.xlsx`)

| Metric | Benchmark Assumption (`cost_inputs`) | Impact with AI Risk Engine | Projected Monthly Savings |
|---|---|---|---|
| **Failed Delivery Cost** | ₱72 / failed parcel | 35% reduction in first-attempt failures | **₱181,440 / month** |
| **Redelivery Retry Cost** | ₱54 / redelivery | 40% reduction in unnecessary retries | **₱116,640 / month** |
| **Late Delivery Penalty** | ₱28 / late parcel | 25% decrease in backlog delay | **₱50,400 / month** |
| **Total Estimated Net Value** | - | **Combined Efficiency Lift** | **~ ₱348,480 / month** |

---

## 🛠️ Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. DATASET LAYER: parcel_history.csv + hub_daily_operations.csv            │
│    - 11,999 parcel rows + 252 hub operating logs stored in Supabase.       │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. AI / ML SCORING ENGINE (XGBoost / Random Forest Classifier)               │
│    - Scans parcel attributes (size, weight, zone, hub backlog, weather).   │
│    - Calculates Delivery Success Probability (e.g. 94% vs 24%).           │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. COST & ROI ENGINE: cost_assumptions.xlsx                                 │
│    - Applies unit costs (₱72 failed parcel, ₱54 redelivery, ₱28 late).     │
│    - Calculates ₱348,480 / month net efficiency savings for Shopee.        │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. RIDER APP FRONTEND (dashboard.html -> details.html -> status -> reason)   │
│    - 1 Hardcoded Rider presenting the 4 parcel cards.                      │
│    - Displays AI Risk Scores & Badges (High Risk, Hub Backlog, Routing).   │
└─────────────────────────────────────────────────────────────────────────────┘
```
