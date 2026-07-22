"""
==============================================================================
Shopee Express AI - Optimal Customer Parcel History Analytics Engine
==============================================================================
Sets the optimal statistical distribution of customer parcel histories (8 to 24 parcels)
to train personal time-of-day availability windows and failure risk predictors.
"""

import json

# Optimal Customer Personal Parcel History Profiles (8 to 24 parcels per customer)
OPTIMAL_CUSTOMER_HISTORIES = {
    "CUST_001": {
        "customer_id": "CUST_001",
        "name": "Juan Dela Cruz",
        "phone": "+63 912 345 6789",
        "total_past_parcels": 15,
        "past_successful": 15,
        "past_failed": 0,
        "past_cod_failures": 0,
        "personal_success_rate": 100.0,
        "preferred_time_window": "11:00 AM – 1:00 PM",
        "customer_tier": "Regular Shopper (15 Orders)",
        "ai_personalized_insight": "100% historical delivery success across 15 past orders. Consistently receives COD packages during mid-day window (11:00 AM – 1:00 PM)."
    },
    "CUST_002": {
        "customer_id": "CUST_002",
        "name": "Maria Santos",
        "phone": "+63 918 234 5678",
        "total_past_parcels": 24,
        "past_successful": 24,
        "past_failed": 0,
        "past_cod_failures": 0,
        "personal_success_rate": 100.0,
        "preferred_time_window": "9:00 AM – 11:00 AM",
        "customer_tier": "Power Shopper (24 Orders)",
        "ai_personalized_insight": "100% historical delivery success across 24 prepaid office orders during morning desk hours (9:00 AM – 11:00 AM)."
    },
    "CUST_003": {
        "customer_id": "CUST_003",
        "name": "Alex Reyes",
        "phone": "+63 920 345 6789",
        "total_past_parcels": 10,
        "past_successful": 4,
        "past_failed": 6,
        "past_cod_failures": 6,
        "personal_success_rate": 40.0,
        "preferred_time_window": "3:00 PM – 5:00 PM (Personalized)",
        "customer_tier": "Working Professional (10 Orders)",
        "ai_personalized_insight": "PERSONALIZED AI PATTERN: Fails morning COD attempts (6 past failures 9am-1pm while at office). All 4 successful deliveries occurred AFTER 3:00 PM when home. AI recommends afternoon dispatch (3:00 PM – 5:00 PM)."
    },
    "CUST_004": {
        "customer_id": "CUST_004",
        "name": "Mark Bautista",
        "phone": "+63 922 456 7890",
        "total_past_parcels": 8,
        "past_successful": 2,
        "past_failed": 6,
        "past_cod_failures": 0,
        "personal_success_rate": 25.0,
        "preferred_time_window": "10:00 AM – 12:00 PM (Post-Verification)",
        "customer_tier": "Frequent Shopper (8 Orders)",
        "ai_personalized_insight": "PERSONALIZED AI PATTERN: 6 past address routing failures due to missing unit number on East Rd. Once unit number is verified via SMS, optimal delivery window is 10:00 AM – 12:00 PM."
    }
}

def get_optimal_customer_history(customer_id):
    return OPTIMAL_CUSTOMER_HISTORIES.get(customer_id, OPTIMAL_CUSTOMER_HISTORIES["CUST_001"])

if __name__ == "__main__":
    print("Optimal Customer Parcel History Distribution:")
    print("=" * 70)
    for c_id in ["CUST_001", "CUST_002", "CUST_003", "CUST_004"]:
        p = get_optimal_customer_history(c_id)
        print(f"\n[{p['name']} - {p['customer_tier']}]")
        print(f"  - Total Past Parcel History: {p['total_past_parcels']} parcels")
        print(f"  - Past Success Rate: {p['personal_success_rate']}% ({p['past_successful']} Succeeded / {p['past_failed']} Failed)")
        print(f"  - AI Personalized Window: {p['preferred_time_window']}")
