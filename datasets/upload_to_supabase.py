"""
Supabase Data Importer for Shopee Express Datasets
Run this script after running datasets/supabase_schema.sql in your Supabase SQL Editor.
"""

import pandas as pd
import requests
import json
import sys

# Replace these with your Supabase Project details from Project Settings -> API
SUPABASE_URL = "YOUR_SUPABASE_URL"  # e.g. https://xyzcompany.supabase.co
SUPABASE_KEY = "YOUR_SUPABASE_SERVICE_ROLE_KEY"  # Service role secret key

def upload_csv(file_path, table_name):
    print(f"Reading {file_path}...")
    df = pd.read_csv(file_path)
    
    # Fill NaN values with None for SQL JSON compatibility
    records = json.loads(df.to_json(orient="records"))
    
    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/{table_name}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    print(f"Uploading {len(records)} records to Supabase table '{table_name}'...")
    
    # Upload in chunks of 500 rows
    chunk_size = 500
    for i in range(0, len(records), chunk_size):
        chunk = records[i:i + chunk_size]
        res = requests.post(endpoint, headers=headers, json=chunk)
        if res.status_code in (200, 201):
            print(f"  Uploaded rows {i+1} to {min(i+chunk_size, len(records))}")
        else:
            print(f"  Error uploading chunk {i}: {res.status_code} - {res.text}")
            break

    print(f"Completed uploading {table_name}!")

if __name__ == "__main__":
    if SUPABASE_URL == "YOUR_SUPABASE_URL" or SUPABASE_KEY == "YOUR_SUPABASE_SERVICE_ROLE_KEY":
        print("\n[!] Please update SUPABASE_URL and SUPABASE_KEY at the top of datasets/upload_to_supabase.py first.")
        sys.exit(1)
        
    upload_csv("datasets/hub_daily_operations.csv", "hub_daily_operations")
    upload_csv("datasets/parcel_history.csv", "parcel_history")
