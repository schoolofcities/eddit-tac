# Analysis pipeline

Everything that produces the data behind the map lives here, as Jupyter notebooks (plus one Python script). Each notebook starts with a table listing its **inputs**, **outputs** and what to **run before** it.

**Where files go** (the same rule everywhere):

| Location | What belongs there |
|---|---|
| `data/<topic>/` | raw downloads and intermediate files (mostly git-ignored when large or licensed) |
| `src/data/<topic>/` | **final** files the web app imports -- notebooks write them directly, nothing is copied by hand |
| `static/` | PMTiles only (the browser needs HTTP range requests for these) |

See [`data/README.md`](../data/README.md) and [`src/data/README.md`](../src/data/README.md).

**Folder convention:** inside each topic folder, `main/` (or numbered files, `01_`, `02_`, ...) is the production pipeline, in run order; `explore/` holds exploratory or one-off notebooks that nothing downstream depends on; `query/` holds notebooks that only run in the Cuebiq workspace.

## How the pieces fit together

```
venues/main/01..03 ──► src/data/venues/*  ─────────────────────────────┐
        │  (venues_geohash9.csv)                                       │
        ▼                                                              │
prelim/toronto_geohash_cover ──► data/geo/geohash/*                    │
        │                                                              ▼
        └──► activity/query (Cuebiq workspace) ──► data/activity/*.csv ──► activity/main/01 ──► src/data/activity/venue_metrics.json
                                                          │   census/02 (ADA gpkg) ─► activity/main/02 ──► src/data/activity/venue_home_origin/
                                                          └──► activity/main/03 ──► src/data/activity/ward_to_venue_summary.json
census/01 → 02 → 03 (TTS) → 04 (creative workers) ──► src/data/census/toronto-ada-wide.geo.json
                                  └─ 05 ──► static/building_census.pmtiles
census/06 ──► data/census/wards/*  ──► wards/explore
mobility/01 → 02 ──► static/commute_time/*.pmtiles      mobility/03 ──► src/data/mobility/hex_walk_30min_res9.geo.json
```

## Run order for a full rebuild

1. **Venues** -- edit `src/data/venues/venues-boundaries.geo.json` (the venue list, edited in QGIS), then `venues/main/03_export_map_layers.ipynb` and `02_geohash9_venues.ipynb`.
2. **Geohash cover** (only if the city boundary changed) -- `prelim/toronto_geohash_cover.ipynb`.
3. **Cuebiq queries** -- run `activity/query/tac_venues_stops_homes.ipynb` in the Cuebiq workspace and download the CSVs into `data/activity/` (see its first cells for the upload/download list).
4. **Census** -- `census/01` through `04` in order. `05` rebuilds the building tiles (needs `tippecanoe`); `06` is only needed for the ward analysis.
5. **Activity** -- `activity/main/01`, `02`, `03` (needs step 3 and `census/02`).
6. **Mobility** -- `mobility/01` -> `02` (see `mobility/README.md`; OTP takes hours) and, independently, `mobility/03`.
7. Build the site: `npm run build` (output goes to `docs/`).

Day-to-day edits only need the affected branch -- for example, new venue boundaries need steps 1, 3, 5 and 6.

## Folders

| Folder | Contents |
|---|---|
| [`venues/`](venues/) | venue list -> map layers and the geohash9 lookup the Cuebiq query uses |
| [`prelim/`](prelim/) | small preparatory notebooks (Toronto geohash cover; an early NOC/NAICS cut) |
| [`activity/`](activity/) | mobile-device activity: Cuebiq queries, the metrics shown in the venue panel, exploration |
| [`census/`](census/) | 2021 Census (+ TTS) -> ADA and ward tables and the building tiles |
| [`mobility/`](mobility/) | transit isochrones (OTP) and walking access |
| [`wards/`](wards/) | ward-level exploratory analyses (`main/` is reserved for the production version) |

## Environment

- Python 3.12 (some notebooks use newer f-string syntax) with Jupyter and: `pandas`, `geopandas`, `pyogrio`, `shapely`, `numpy`, `scipy`, `duckdb`, `tobler`, `python-geohash` (`import geohash`), `pygeohash`, `h3`, `osmnx`, `networkx`, `rasterio`, `requests`, `matplotlib`, `seaborn`, `scikit-learn`, `geopy`, `tqdm`.
- Command-line tools: `tippecanoe` (tiling), Java 8 (only for the OTP step in `mobility/`).
- Notebooks locate the repository root themselves (the nearest parent folder containing `package.json`), so they can be run from any working directory.
