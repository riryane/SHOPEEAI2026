"""
==============================================================================
Shopee Express AI - Mistral AI LLM Live API Integration Engine
==============================================================================
Model: mistral-small-latest
Handles Unstructured Address Parsing, Automated Pre-Verification SMS Generation,
and Optimal Delivery Time Window Recommendations.
"""

import os
import json
import requests

MISTRAL_API_KEY = "zSedUZF7w5nvkheTxoQWdOSaCzTYcGhT"
MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"
MODEL_NAME = "mistral-small-latest"  # Ultra-fast, highly accurate JSON model

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
    
    Perform three tasks and respond in valid JSON format only with keys "address_issue", "sms_prompt", and "recommended_time_slot":
    1. "address_issue": Briefly identify why this address or delivery is risky (e.g., missing unit number, COD unavailability risk, route delay).
    2. "sms_prompt": Draft a polite, professional, short SMS message (in friendly Taglish/English) asking the customer to confirm availability or provide landmark details.
    3. "recommended_time_slot": Suggest an optimal 2-hour delivery window (e.g., "11:00 AM - 1:00 PM").
    """

    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {"type": "json_object"},
        "temperature": 0.3
    }

    try:
        response = requests.post(MISTRAL_API_URL, headers=headers, json=payload)
        if response.status_code == 200:
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            parsed_json = json.loads(content)
            parsed_json["model_used"] = MODEL_NAME
            parsed_json["status"] = "LIVE_MISTRAL_RESPONSE"
            return parsed_json
        else:
            print(f"Mistral API Error: {response.status_code} - {response.text}")
            return {
                "address_issue": f"Address flagged for {failure_risk_reason}. Low ML score ({ml_success_score:.1f}%).",
                "sms_prompt": f"Hi {customer_name}! Shopee Xpress rider Juan will deliver package {parcel_id} today. Please reply to confirm if you are available to receive your order.",
                "recommended_time_slot": "11:00 AM - 1:00 PM",
                "status": "FALLBACK"
            }
    except Exception as e:
        print(f"Mistral Request Exception: {e}")
        return None

if __name__ == "__main__":
    print(f"Executing LIVE Mistral AI API ({MODEL_NAME}) for 4 Demo Parcels:")
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
