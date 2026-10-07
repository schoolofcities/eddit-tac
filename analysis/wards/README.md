# Wards

Ward-level analyses combining the ward census tables (`analysis/census/06`) and ward-level activity (`analysis/activity/main/03`).

- `explore/` -- exploratory notebooks: `explore_census_activity_data` (data audit and first comparisons), `explore_story1_city_reach`, `explore_story2_arts_workers`. They read from `data/census/wards/`, `data/activity/` and `src/data/` and only produce inline charts.
- `main/` -- reserved for the production ward processing; empty for now. Follow the conventions in `analysis/README.md` (numbered notebooks, header table, final outputs written to `src/data/`).
