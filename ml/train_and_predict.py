"""
==============================================================================
Shopee Express AI - Delivery Success Probability Machine Learning Engine
==============================================================================
Trained 100% on datasets/parcel_history.csv & datasets/hub_daily_operations.csv
Calculates Delivery Success Probability Score (0 - 100%) and predicts failure risk.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score, accuracy_score
import json

def train_and_evaluate():
    print("Loading 100% original datasets...")
    parcels_df = pd.read_csv(r'c:\Users\Edelweiss\Desktop\SHOPEE\datasets\parcel_history.csv')
    hub_ops_df = pd.read_csv(r'c:\Users\Edelweiss\Desktop\SHOPEE\datasets\hub_daily_operations.csv')

    print(f"Parcel History dataset: {len(parcels_df)} rows")
    print(f"Hub Daily Operations dataset: {len(hub_ops_df)} rows")

    # Merge dataset on date and hub_id
    df = pd.merge(parcels_df, hub_ops_df, on=['date', 'hub_id'], how='left')

    # Binary Target: 1 = Failed/Late, 0 = Delivered On Time
    df['is_failed_or_late'] = df['delivery_outcome'].apply(lambda x: 0 if x == 'delivered_on_time' else 1)

    # Feature Selection
    cat_cols = ['origin_zone', 'destination_zone', 'service_type', 'seller_type', 'parcel_size_band', 'parcel_weight_band']
    num_cols = ['promised_delivery_days', 'attempt_count', 'avg_parcels_per_rider', 'avg_sorting_backlog', 'avg_dispatch_delay_hours', 'vehicle_availability_rate']
    bool_cols = ['is_redelivery', 'customer_contact_made', 'priority_flag', 'peak_day_flag', 'traffic_disruption_flag', 'weather_disruption_flag', 'temporary_staff_used']

    # Convert Booleans
    for col in bool_cols:
        if col in df.columns:
            df[col] = df[col].astype(int)

    # One-Hot Encoding for categorical features
    df_encoded = pd.get_dummies(df, columns=cat_cols, drop_first=False)

    # Feature List
    feature_cols = [c for c in df_encoded.columns if c not in [
        'parcel_id', 'hub_id', 'date', 'delivery_outcome', 'failure_reason', 
        'actual_delivery_days', 'was_late', 'region', 'hub_type', 'is_failed_or_late'
    ]]

    X = df_encoded[feature_cols]
    y = df_encoded['is_failed_or_late']

    # Train / Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print("\nTraining Machine Learning Risk Model (RandomForest Classifier)...")
    clf = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
    clf.fit(X_train, y_train)

    # Evaluation
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)

    print(f"Model Accuracy: {acc * 100:.2f}%")
    print(f"Model ROC-AUC Score: {auc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Delivered On Time', 'Failed / Late']))

    # Feature Importance Top 10
    importances = clf.feature_importances_
    indices = np.argsort(importances)[::-1][:10]
    print("\nTop 10 AI Model Feature Predictors:")
    for idx in indices:
        print(f"  - {feature_cols[idx]}: {importances[idx]:.4f}")

    # Predict Demo Parcels (P0000001, P0000003, P0000012, P0000014)
    demo_parcels = ['P0000001', 'P0000003', 'P0000012', 'P0000014']
    print("\n" + "=" * 70)
    print("SCORING 4 DEMO PARCELS FROM DATASET:")
    print("=" * 70)

    demo_df = df_encoded[df_encoded['parcel_id'].isin(demo_parcels)].copy()
    demo_preds_proba = clf.predict_proba(demo_df[feature_cols])

    for i, row in demo_df.iterrows():
        p_id = row['parcel_id']
        fail_prob = demo_preds_proba[demo_df.index.get_loc(i)][1]
        success_prob = (1 - fail_prob) * 100
        outcome = row['delivery_outcome']
        reason = row['failure_reason'] if pd.notna(row['failure_reason']) else 'None'
        
        risk_level = "LOW RISK" if success_prob >= 70 else ("MEDIUM RISK" if success_prob >= 45 else "HIGH RISK")
        
        print(f"Parcel ID: {p_id} | Actual Outcome: {outcome}")
        print(f"  - Calculated Success Score: {success_prob:.1f}%")
        print(f"  - AI Risk Category: {risk_level}")
        print(f"  - Failure Reason in Dataset: {reason}")
        print("-" * 50)

if __name__ == "__main__":
    train_and_evaluate()
