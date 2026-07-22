# SPX Synthetic Student Case Data Pack

This folder contains a standalone synthetic data pack for a university hackathon case. It is separate from the SQL analysis files in the main project.

## Final artifacts

- `outputs/parcel_history.csv` - one row per synthetic parcel outcome
- `outputs/hub_daily_operations.csv` - one row per hub per day
- `outputs/cost_assumptions.xlsx` - editable cost, value, and solution-menu assumptions
- `outputs/data_dictionary.pdf` - short student-facing guide and data dictionary

## Synthetic design

- 6 fictional hubs
- 42 operating days, from 2026-04-01 to 2026-05-12
- 11,999 parcel rows
- 252 hub-day rows
- Built-in but noisy patterns:
  - `HUB_C_SOUTH` has stronger rider load and backlog stress.
  - `HUB_E_WEST` has stronger address quality and customer availability issues.
  - `HUB_F_RIVER` is more sensitive to weather, traffic, and vehicle availability disruption.

These are learning artifacts, not real SPX operating data.
