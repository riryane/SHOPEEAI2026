-- ============================================================================
-- Supabase Tables for Cost Assumptions, Solution Menu, and Data Dictionary
-- (Enables AI/ML models & analytics to query cost proxies & metrics directly)
-- ============================================================================

-- 1. Cost Inputs Table
CREATE TABLE IF NOT EXISTS cost_inputs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    input_name VARCHAR(100) UNIQUE NOT NULL,
    value NUMERIC(12,2) NOT NULL,
    unit VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Value Inputs Table
CREATE TABLE IF NOT EXISTS value_inputs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    input_name VARCHAR(100) UNIQUE NOT NULL,
    value NUMERIC(12,2) NOT NULL,
    unit VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Solution Menu Table
CREATE TABLE IF NOT EXISTS solution_menu (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    intervention VARCHAR(100) NOT NULL,
    primary_problem_addressed VARCHAR(100),
    likely_pilot_hub VARCHAR(50),
    one_time_cost NUMERIC(12,2),
    monthly_recurring_cost NUMERIC(12,2),
    expected_ontime_pp_lift NUMERIC(6,2),
    expected_failed_pp_reduction NUMERIC(6,2),
    expected_redelivery_pp_reduction NUMERIC(6,2),
    first_year_cost NUMERIC(12,2),
    estimated_monthly_value NUMERIC(12,2),
    breakeven_months NUMERIC(6,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Data Dictionary Table
CREATE TABLE IF NOT EXISTS data_dictionary (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    column_name VARCHAR(100) NOT NULL,
    dataset_table VARCHAR(50) NOT NULL,
    data_type VARCHAR(50),
    allowed_values_or_units TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_col_table UNIQUE (column_name, dataset_table)
);
