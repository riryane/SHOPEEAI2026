-- ============================================================================
-- Supabase Table Schemas for Shopee Express Data Analytics & AI/ML
-- ============================================================================

-- 1. Hub Daily Operations Table
CREATE TABLE IF NOT EXISTS hub_daily_operations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    date DATE NOT NULL,
    hub_id VARCHAR(50) NOT NULL,
    region VARCHAR(50) NOT NULL,
    hub_type VARCHAR(50) NOT NULL,
    daily_parcel_volume INT DEFAULT 0,
    daily_successful_deliveries INT DEFAULT 0,
    daily_failed_deliveries INT DEFAULT 0,
    daily_late_deliveries INT DEFAULT 0,
    active_riders INT DEFAULT 0,
    available_sort_staff INT DEFAULT 0,
    overtime_hours NUMERIC(6,2) DEFAULT 0.0,
    avg_parcels_per_rider NUMERIC(6,2) DEFAULT 0.0,
    avg_sorting_backlog INT DEFAULT 0,
    avg_dispatch_delay_hours NUMERIC(6,2) DEFAULT 0.0,
    vehicle_availability_rate NUMERIC(5,3) DEFAULT 1.0,
    traffic_disruption_flag BOOLEAN DEFAULT FALSE,
    weather_disruption_flag BOOLEAN DEFAULT FALSE,
    temporary_staff_used BOOLEAN DEFAULT FALSE,
    customer_complaints_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_hub_day UNIQUE (date, hub_id)
);

-- Indexing for Hub Analytics
CREATE INDEX IF NOT EXISTS idx_hub_ops_date ON hub_daily_operations(date);
CREATE INDEX IF NOT EXISTS idx_hub_ops_hub_id ON hub_daily_operations(hub_id);


-- 2. Parcel History Table
CREATE TABLE IF NOT EXISTS parcel_history (
    parcel_id VARCHAR(50) PRIMARY KEY,
    hub_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    origin_zone VARCHAR(50),
    destination_zone VARCHAR(50),
    service_type VARCHAR(30),
    seller_type VARCHAR(30),
    parcel_size_band VARCHAR(10),
    parcel_weight_band VARCHAR(20),
    promised_delivery_days INT,
    actual_delivery_days INT,
    delivery_outcome VARCHAR(50) NOT NULL,
    failure_reason VARCHAR(100),
    attempt_count INT DEFAULT 1,
    is_redelivery BOOLEAN DEFAULT FALSE,
    was_late BOOLEAN DEFAULT FALSE,
    customer_contact_made BOOLEAN DEFAULT FALSE,
    priority_flag BOOLEAN DEFAULT FALSE,
    peak_day_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for AI/ML & Filtering
CREATE INDEX IF NOT EXISTS idx_parcel_hub_id ON parcel_history(hub_id);
CREATE INDEX IF NOT EXISTS idx_parcel_date ON parcel_history(date);
CREATE INDEX IF NOT EXISTS idx_parcel_outcome ON parcel_history(delivery_outcome);
CREATE INDEX IF NOT EXISTS idx_parcel_late ON parcel_history(was_late);
CREATE INDEX IF NOT EXISTS idx_parcel_zones ON parcel_history(origin_zone, destination_zone);
