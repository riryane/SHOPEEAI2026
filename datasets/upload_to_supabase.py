"""
Supabase Data Importer for Shopee Express Datasets
"""

import pandas as pd
import requests
import json
import sys

SUPABASE_URL = "https://egfeipuqspptnderrfga.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZmVpcHVxc3BwdG5kZXJyZmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MDU2NzAsImV4cCI6MjEwMDI4MTY3MH0.Y9V9W0xKPHk4Vv9TOZwzNePWMX9epasVuR_-CzgRwCk"

def upload_csv(file_path, table_name):
    print(f"Reading {file_path}...")
    df = pd.read_csv(file_path)
    
    # Replace NaN with None for valid JSON
    records = json.loads(df.to_json(orient="records"))
    
    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/{table_name}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    print(f"Uploading {len(records)} records to Supabase table '{table_name}'...")
    
    chunk_size = 300
    success_count = 0
    for i in range(0, len(records), chunk_size):
        chunk = records[i:i + chunk_size]
        res = requests.post(endpoint, headers=headers, json=chunk)
        if res.status_code in (200, 201):
            success_count += len(chunk)
            print(f"  [+] Uploaded rows {i+1} to {min(i+chunk_size, len(records))}")
        else:
            print(f"  [-] Error uploading chunk starting at row {i+1}: {res.status_code} - {res.text}")
            break

    print(f"Finished {table_name}: {success_count}/{len(records)} rows uploaded.")

if __name__ == "__main__":
    print("Starting automated Supabase data upload...")
    upload_csv("datasets/hub_daily_operations.csv", "hub_daily_operations")
    print("-" * 50)
    upload_csv("datasets/parcel_history.csv", "parcel_history")
