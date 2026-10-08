# Activity (mobile-device visits to TAC venues)

The raw counts come from Cuebiq mobility data and are **licensed -- `data/activity/` is git-ignored and raw counts must not be published**. The map therefore only uses proportions/percentages (`venue_metrics.json`, per-ADA percent shares).

```
query/    runs in the Cuebiq workspace -> CSVs you download into data/activity/
main/     production notebooks, in run order -> files in src/data/activity/
explore/  one-off exploration and reports (nothing downstream depends on them)
```

## `query/` (Cuebiq workspace only)
- `tac_venues_stops_homes.ipynb` -- builds venue visits, repeat visitors, home origins and sample-normalisation tables for July 2023 - June 2026. Its first cells list what to upload (venue boundaries, `venues_geohash9.csv`, the Toronto geohash lists) and which seven CSVs to download into `data/activity/`.
- `explore_tac_sample_normalization_ultrafast.ipynb` -- quick diagnostic of the sample-normalisation approach; prints only.

## `main/` (run in order, after the queries)
| Notebook | Reads | Writes |
|---|---|---|
| `01_venue_metrics.ipynb` | `data/activity/venue_stops.csv`, `venues_repeat_visitors.csv`, `venues_homes.csv`; venue list | `src/data/activity/venue_metrics.json` (venue profile panel) |
| `02_venue_home_origin_by_ada.ipynb` | `data/activity/venues_homes.csv`; `data/census/ada-wide/toronto-ada-wide.gpkg` (from `census/02`) | `src/data/activity/venue_home_origin/venue_<id>.json` (home-origin choropleth) |
| `03_ward_venue_activity.ipynb` | `data/activity/venues_homes.csv`; venue centroids; ward boundaries | `src/data/activity/ward_to_venue_summary.json` (venue panel); full ward tables in `data/activity/wards/` (used by `analysis/wards/`) |

## `explore/`
`explore_venue_activity_data.ipynb` (broad exploration), `create_plots_report_260422.ipynb` (figures for the April 2026 report), `visualize_test3.ipynb` (early three-venue test). Their figures and tables go to `data/activity/explore/`.
