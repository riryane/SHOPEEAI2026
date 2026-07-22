"""
==============================================================================
Shopee Express AI - Mistral AI LLM Integration
==============================================================================
Handles Unstructured Address Parsing, Automated Pre-Verification SMS Generation,
and Rider Failure Cause Analysis using Mistral AI models (e.g. mistral-small / mistral-medium).
"""

import os
import json
import requests

# Set your Mistral API Key (e.g. os.environ.get("MISTRAL_API_KEY"))
MISTRAL_API_KEY = os.environ.get("MISTRAL_API_KEY", "YOUR_MISTRAL_API_KEY")
MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"

def parse_address_and_generate_sms(parcel_id, customer_name, address, payment_method, ml_success_score, failure_risk_reason):
    """
    Uses Mistral AI to parse address anomalies and draft automated customer verification SMS prompts.
    """
    prompt = f"""
    You are the Shopee Express AI Logistics Assistant.
    Analyze the following delivery order flagged by our Machine Learning Risk Engine:
    
    - Parcel ID: {parcel_id}
    - Customer Name: {customer_name}
    - Address: {address}
    - Payment Method: {payment_method}
    - ML Delivery Success Score: {ml_success_score:.1f}%
    - ML Risk Reason: {failure_risk_reason}
    
    Perform two tasks and respond in valid JSON format only:
    1. "address_issue": Briefly identify why this address or delivery is risky (e.g., missing unit number, COD unavailability risk, route delay).
    2. "sms_prompt": Draft a polite, professional, short SMS message (in friendly English or Taglish) asking the customer to confirm their availability or provide landmark details.
    3. "recommended_time_slot": Suggest an optimal 2-hour delivery window (e.g., "11:00 AM - 1:00 PM").
    """

    # Fallback response for offline / hackathon local testing
    if MISTRAL_API_KEY == "YOUR_MISTRAL_API_KEY":
        return {
            "address_issue": f"Address flagged for {failure_risk_reason}. Low ML success probability ({ml_success_score:.1f}%).",
            "sms_prompt": f"Hi {customer_name}! Shopee Xpress rider Juan will deliver package {parcel_id} today. Please reply to confirm if you are available to receive your order.",
            "recommended_time_slot": "11:00 AM - 1:00 PM",
            "source": "Mock Mistral AI Engine (Add MISTRAL_API_KEY to activate live API)"
        }

    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "mistral-small-latest",
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {"type": "json_object"},
        "temperature": 0.3
    }

    try:
        response = requests.post(MISTRAL_API_URL, headers=headers, json=payload)
        if response.status_code == 200:
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            return json.loads(content)
        else:
            print(f"Mistral API Error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Mistral Request Error: {e}")
        return None

if __name__ == "__main__":
    print("Testing Mistral AI Integration on High Risk Demo Parcels:")
    print("=" * 70)
    
    # Test Parcel 3 (Alex Reyes - P0000012)
    p3 = parse_address_and_generate_sms(
        parcel_id="P0000012",
        customer_name="Alex Reyes",
        address="28 Sunrise St., Brgy. San Isidro, Cainta, Rizal",
        payment_method="COD",
        ml_success_score=45.1,
        failure_risk_reason="hub backlog & COD availability"
    )
    print("\n[Parcel P0000012 - Alex Reyes]")
    print(json.dumps(p3, indent=2))

    # Test Parcel 4 (Mark Bautista - P0000014)
    p4 = parse_address_and_generate_sms(
        parcel_id="P0000014",
        customer_name="Mark Bautista",
        address="91 East Rd., Brgy. Sta. Clara, Cainta, Rizal",
        payment_method="PREPAID",
        ml_success_score=25.7,
        failure_risk_reason="routing delay & missing unit number"
    )
    print("\n[Parcel P0000014 - Mark Bautista]")
    print(json.dumps(p4, indent=2))
