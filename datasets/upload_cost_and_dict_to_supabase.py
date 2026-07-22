"""
Automated Supabase Importer for Cost Assumptions & Data Dictionary
"""

import pandas as pd
import requests
import json
import pypdf
import re

SUPABASE_URL = "https://egfeipuqspptnderrfga.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZmVpcHVxc3BwdG5kZXJyZmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MDU2NzAsImV4cCI6MjEwMDI4MTY3MH0.Y9V9W0xKPHk4Vv9TOZwzNePWMX9epasVuR_-CzgRwCk"

def upload_to_supabase(table_name, records):
    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/{table_name}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    print(f"Uploading {len(records)} records to '{table_name}'...")
    res = requests.post(endpoint, headers=headers, json=records)
    if res.status_code in (200, 201):
        print(f"  [+] Successfully uploaded {len(records)} rows to '{table_name}'!")
    else:
        print(f"  [-] Error uploading to '{table_name}': {res.status_code} - {res.text}")

def parse_excel():
    excel_file = r'c:\Users\Edelweiss\Desktop\SHOPEE\datasets\cost_assumptions.xlsx'
    
    # 1. cost_inputs
    df_cost = pd.read_excel(excel_file, sheet_name='cost_inputs', skiprows=3, names=['input_name', 'value', 'unit', 'notes'])
    df_cost = df_cost.dropna(subset=['input_name'])
    cost_records = json.loads(df_cost.to_json(orient='records'))
    upload_to_supabase('cost_inputs', cost_records)

    # 2. value_inputs
    df_val = pd.read_excel(excel_file, sheet_name='value_inputs', skiprows=3, names=['input_name', 'value', 'unit', 'notes'])
    df_val = df_val.dropna(subset=['input_name'])
    val_records = json.loads(df_val.to_json(orient='records'))
    upload_to_supabase('value_inputs', val_records)

    # 3. solution_menu
    cols_solution = [
        'intervention', 'primary_problem_addressed', 'likely_pilot_hub', 
        'one_time_cost', 'monthly_recurring_cost', 'expected_ontime_pp_lift', 
        'expected_failed_pp_reduction', 'expected_redelivery_pp_reduction', 
        'first_year_cost', 'estimated_monthly_value', 'breakeven_months'
    ]
    df_sol = pd.read_excel(excel_file, sheet_name='solution_menu', skiprows=3, names=cols_solution)
    df_sol = df_sol.dropna(subset=['intervention'])
    sol_records = json.loads(df_sol.to_json(orient='records'))
    upload_to_supabase('solution_menu', sol_records)

def parse_data_dictionary():
    # Hardcoded complete data dictionary entries from data_dictionary.pdf
    dict_records = [
        # parcel_history table
        {"column_name": "parcel_id", "dataset_table": "parcel_history", "data_type": "Text", "allowed_values_or_units": "P0000001 style", "description": "Unique synthetic parcel identifier."},
        {"column_name": "hub_id", "dataset_table": "parcel_history", "data_type": "Text", "allowed_values_or_units": "HUB_A_NORTH, HUB_B_CENTRAL, HUB_C_SOUTH, HUB_D_EAST, HUB_E_WEST, HUB_F_RIVER", "description": "Fictional hub responsible for last-mile delivery."},
        {"column_name": "date", "dataset_table": "parcel_history", "data_type": "Date", "allowed_values_or_units": "yyyy-mm-dd", "description": "Calendar date for parcel outcome or hub operating day."},
        {"column_name": "origin_zone", "dataset_table": "parcel_history", "data_type": "Category", "allowed_values_or_units": "Metro, North, South, East, West, River", "description": "Broad pickup/origin zone."},
        {"column_name": "destination_zone", "dataset_table": "parcel_history", "data_type": "Category", "allowed_values_or_units": "Metro, North, South, East, West, River, Remote", "description": "Broad destination zone."},
        {"column_name": "service_type", "dataset_table": "parcel_history", "data_type": "Category", "allowed_values_or_units": "standard, express, economy", "description": "Delivery promise tier."},
        {"column_name": "seller_type", "dataset_table": "parcel_history", "data_type": "Category", "allowed_values_or_units": "marketplace, direct_seller, small_business, enterprise", "description": "Simplified seller segment."},
        {"column_name": "parcel_size_band", "dataset_table": "parcel_history", "data_type": "Category", "allowed_values_or_units": "XS, S, M, L, XL", "description": "Size category used for handling complexity."},
        {"column_name": "parcel_weight_band", "dataset_table": "parcel_history", "data_type": "Category", "allowed_values_or_units": "0-1kg, 1-3kg, 3-5kg, 5-10kg, 10kg+", "description": "Weight category used for handling complexity."},
        {"column_name": "promised_delivery_days", "dataset_table": "parcel_history", "data_type": "Number", "allowed_values_or_units": "1, 2, 3", "description": "Days promised to customer."},
        {"column_name": "actual_delivery_days", "dataset_table": "parcel_history", "data_type": "Number", "allowed_values_or_units": "Whole days", "description": "Actual days to final outcome."},
        {"column_name": "delivery_outcome", "dataset_table": "parcel_history", "data_type": "Category", "allowed_values_or_units": "delivered_on_time, delivered_late, failed", "description": "Final parcel status for analysis."},
        {"column_name": "failure_reason", "dataset_table": "parcel_history", "data_type": "Category", "allowed_values_or_units": "customer not available, bad address, rider capacity, routing delay, hub backlog, weather/disruption", "description": "Primary reason if delivery_outcome is failed."},
        {"column_name": "attempt_count", "dataset_table": "parcel_history", "data_type": "Number", "allowed_values_or_units": "1 to 4", "description": "Delivery attempts recorded for the parcel."},
        {"column_name": "is_redelivery", "dataset_table": "parcel_history", "data_type": "Boolean", "allowed_values_or_units": "TRUE/FALSE", "description": "Whether more than one attempt was needed."},
        {"column_name": "was_late", "dataset_table": "parcel_history", "data_type": "Boolean", "allowed_values_or_units": "TRUE/FALSE", "description": "Whether actual delivery exceeded promise."},
        {"column_name": "customer_contact_made", "dataset_table": "parcel_history", "data_type": "Boolean", "allowed_values_or_units": "TRUE/FALSE", "description": "Whether the operation contacted the customer."},
        {"column_name": "priority_flag", "dataset_table": "parcel_history", "data_type": "Boolean", "allowed_values_or_units": "TRUE/FALSE", "description": "Whether the parcel received priority handling."},
        {"column_name": "peak_day_flag", "dataset_table": "parcel_history", "data_type": "Boolean", "allowed_values_or_units": "TRUE/FALSE", "description": "Whether the date had elevated volume pressure."},
        
        # hub_daily_operations table
        {"column_name": "region", "dataset_table": "hub_daily_operations", "data_type": "Category", "allowed_values_or_units": "Metro/Province/River corridor labels", "description": "Broad operating region for the hub."},
        {"column_name": "hub_type", "dataset_table": "hub_daily_operations", "data_type": "Category", "allowed_values_or_units": "urban, suburban, mixed", "description": "Hub operating environment."},
        {"column_name": "daily_parcel_volume", "dataset_table": "hub_daily_operations", "data_type": "Number", "allowed_values_or_units": "Parcel count", "description": "Parcels represented for the hub that day."},
        {"column_name": "daily_successful_deliveries", "dataset_table": "hub_daily_operations", "data_type": "Number", "allowed_values_or_units": "Parcel count", "description": "Delivered parcels that did not fail."},
        {"column_name": "daily_failed_deliveries", "dataset_table": "hub_daily_operations", "data_type": "Number", "allowed_values_or_units": "Parcel count", "description": "Failed delivery parcels."},
        {"column_name": "daily_late_deliveries", "dataset_table": "hub_daily_operations", "data_type": "Number", "allowed_values_or_units": "Parcel count", "description": "Parcels flagged late, including some failed attempts."},
        {"column_name": "active_riders", "dataset_table": "hub_daily_operations", "data_type": "Number", "allowed_values_or_units": "Headcount", "description": "Riders available for delivery that day."},
        {"column_name": "available_sort_staff", "dataset_table": "hub_daily_operations", "data_type": "Number", "allowed_values_or_units": "Headcount", "description": "Sort staff available at the hub that day."},
        {"column_name": "overtime_hours", "dataset_table": "hub_daily_operations", "data_type": "Number", "allowed_values_or_units": "Hours", "description": "Estimated overtime used that day."},
        {"column_name": "avg_parcels_per_rider", "dataset_table": "hub_daily_operations", "data_type": "Number", "allowed_values_or_units": "Parcels/rider", "description": "Daily workload per active rider."},
        {"column_name": "avg_sorting_backlog", "dataset_table": "hub_daily_operations", "data_type": "Number", "allowed_values_or_units": "Parcel count", "description": "Average parcels waiting after sorting cutoff."},
        {"column_name": "avg_dispatch_delay_hours", "dataset_table": "hub_daily_operations", "data_type": "Number", "allowed_values_or_units": "Hours", "description": "Average delay from ready-to-dispatch to dispatch."},
        {"column_name": "vehicle_availability_rate", "dataset_table": "hub_daily_operations", "data_type": "Percent", "allowed_values_or_units": "0.00 to 1.00", "description": "Share of planned vehicles available."},
        {"column_name": "traffic_disruption_flag", "dataset_table": "hub_daily_operations", "data_type": "Boolean", "allowed_values_or_units": "TRUE/FALSE", "description": "Whether traffic disruption affected the hub."},
        {"column_name": "weather_disruption_flag", "dataset_table": "hub_daily_operations", "data_type": "Boolean", "allowed_values_or_units": "TRUE/FALSE", "description": "Whether weather or local disruption affected the hub."},
        {"column_name": "temporary_staff_used", "dataset_table": "hub_daily_operations", "data_type": "Boolean", "allowed_values_or_units": "TRUE/FALSE", "description": "Whether temporary staff were used."},
        {"column_name": "customer_complaints_count", "dataset_table": "hub_daily_operations", "data_type": "Number", "allowed_values_or_units": "Count", "description": "Customer complaints attributed to the hub/date."}
    ]
    upload_to_supabase('data_dictionary', dict_records)

if __name__ == "__main__":
    print("Starting upload of Cost Assumptions & Data Dictionary to Supabase...")
    parse_excel()
    parse_data_dictionary()
    print("Completed all uploads!")
