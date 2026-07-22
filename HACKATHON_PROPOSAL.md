# 🚀 Hackathon Proposal: Shopee Express AI-Powered Delivery Risk Scoring & Rider Optimization System

## 🎯 Thesis Statement
To practically improve Shopee’s delivery efficiency within a hackathon timeframe, we will integrate an **LLM AI API scoring system** that flags high-risk delivery parcels at checkout, prioritizes real-time rider verification prompts for ambiguous locations, and provides a front-end dashboard predicting optimal customer delivery windows.

---

## 🏛️ Strategic Pillars & Technical Scope

### Major Point 1: Predictive Parcel Success Probability Engine (24-Hour MVP)
- **AI Training Strategy (Global Network Training)**: The AI scoring engine is trained on **all 6 hubs (11,999 parcel rows + 252 hub operating logs)** in Supabase to capture global logistics failure patterns (volume spikes, weather sensitivity, weight/size risk).
- **Pilot Implementation Strategy (Single Hub Focus)**: While the AI is trained network-wide, our operational MVP pilot is deployed on **1 single hub (`HUB_A_NORTH`)** for controlled last-mile execution.
- **Backend API**: Exposes a REST endpoint `/api/v1/score-delivery` calculating real-time **Delivery Success Probability Scores (0 - 100%)**.

### Major Point 2: Rapid Data Pipeline & Edge-Case Handling
- **Challenge**: Overcoming operational bottlenecks such as hub sorting backlogs, routing delays, and customer unavailability without creating external datasets.
- **Strategy**: 
  - Standardize spatial route risk features (`origin_zone` -> `destination_zone`) combined with hub operational metrics (`avg_dispatch_delay_hours`, `weather_disruption_flag`).
  - Classify delivery outcomes (`delivered_on_time`, `delivered_late`, `failed`) and map failure reasons (`hub backlog`, `routing delay`, `customer not available`).
  - Pre-calculate risk buckets (`LOW_RISK`, `HIGH_RISK`) stored directly in Supabase for sub-50ms query response.

### Major Point 3: Rider App Integration & Automated Pre-Verification
- **Prototyping Strategy**: Hardcoded 1 Rider frontend interface displaying 4 Real Parcels from `HUB_A_NORTH` extracted directly from `parcel_history.csv`.
- **Rider Workflow**: Displays risk scores and warning badges (`HIGH RISK`, `Hub Backlog Risk`, `Routing Delay`) directly on `dashboard.html` and `details.html`. Triggers automated SMS / verification prompts to high-risk customers prior to rider dispatch.

---

## 📦 Demo Case Study Architecture: Global AI Training + 1 Single Hub Pilot (`HUB_A_NORTH`)

### 🛵 Assigned Front-End Rider:
- **Rider**: **Rider Juan** (Hardcoded 1 Rider view in `dashboard.html`)
- **Single Hub Focus**: `HUB_A_NORTH` (Cainta, Rizal)

### 📦 4 Real Parcels (Extracted Verbatim from `parcel_history.csv` in Supabase):

| Parcel ID | Recipient Name | Payment | Parcel Attributes (`parcel_history.csv`) | Historical Outcome | Failure Reason | Risk Level | ML Score | Triggered Action |
|---|---|---|---|---|---|---|---|---|
| `P0000001` | **Juan Dela Cruz** | COD (₱245.00) | Economy \| Small Box \| South -> Metro | `delivered_on_time` | Delivered (Attempt 1) | 🟢 **LOW RISK** | **70.6%** | Standard Dispatch |
| `P0000003` | **Maria Santos** | PREPAID | Standard \| Enterprise \| East -> Metro | `delivered_on_time` | Delivered (Attempt 1) | 🟢 **LOW RISK** | **92.9%** | Standard Dispatch |
| `P0000012` | **Alex Reyes** | COD (₱560.00) | Standard \| Marketplace \| West -> Metro | `failed` | `hub backlog` | 🟡 **MEDIUM RISK** | **45.1%** | Priority Sorting Prompt |
| `P0000014` | **Mark Bautista** | PREPAID | Standard \| Direct Seller \| River -> Metro | `failed` | `routing delay` (3 attempts) | 🔴 **HIGH RISK** | **25.7%** | Route Verification & Call Prompt |

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
│ 1. GLOBAL DATASET LAYER (All 6 Hubs: 11,999 Parcels + 252 Hub Days)        │
│    - Full network dataset stored in Supabase for global model learning.    │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. AI / ML SCORING ENGINE (Trained Globally on All 6 Hubs)                  │
│    - Learns network-wide failure drivers (backlog, routing, weather).       │
│    - Calculates Delivery Success Probability (e.g. 92.9% vs 25.7%).        │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. SINGLE HUB PILOT ROLLOUT (Targeted at HUB_A_NORTH)                       │
│    - Applies unit costs (₱72 failed parcel, ₱54 redelivery, ₱28 late).     │
│    - Proves ₱348,480 / month net savings in a controlled pilot hub.        │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. RIDER APP FRONTEND (dashboard.html -> details.html -> status -> reason)   │
│    - 1 Hardcoded Rider presenting the 4 parcel cards for HUB_A_NORTH.       │
│    - Displays AI Risk Scores & Badges (High Risk, Hub Backlog, Routing).   │
└─────────────────────────────────────────────────────────────────────────────┘
```
