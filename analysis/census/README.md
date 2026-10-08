# Census

Builds the census layers for the map (ADA level), the building tiles, and the ward-level tables for the ward analysis. Run in numbered order.

| # | Notebook | Reads | Writes |
|---|---|---|---|
| 01 | `01_extract_ada_profile` | StatCan Census Profile (ADA) in `data/census/ada/`; ADA boundary shapefile | `data/census/ada/toronto-ada.csv`, `data/geo/toronto-ada.gpkg` |
| 02 | `02_prepare_ada_wide` | step 01 outputs; custom creative-worker parquet; census-tract boundaries | `data/census/ada-wide/toronto-ada-wide.*` (one column per census variable), `toronto-tract-noc-naics.*` |
| 03 | `03_interpolate_tts` | `toronto-ada-wide.geojson`; `data/census/tts/tts2022.geojson` | `data/census/ada-wide/ada-wide-tts.*` (adds `hh_no_veh_pct`) |
| 04 | `04_interpolate_noc_naics` | `ada-wide-tts.geojson`; `toronto-tract-noc-naics.geojson` | **`src/data/census/toronto-ada-wide.geo.json`** -- the ADA layer on the map |
| 05 | `05_osm_buildings_census_join` | boundary + ADA layer from `src/data/`; OSM buildings (live) | **`static/building_census.pmtiles`** |
| 06 | `06_extract_census_wards` | StatCan Census Profile (federal ridings = wards); tract creative-worker data; ward boundaries | `data/census/wards/toronto-wards.csv`, `toronto-wards-noc-naics.csv` (ward analysis only) |

Steps 02 -> 03 -> 04 each add columns to the same ADA table, so run them in that order. To add another interpolated variable, follow the pattern in step 03 or 04 and write the final result in step 04's output cell.

After changing the ADA layer, `activity/main/02` (which uses `toronto-ada-wide.gpkg` from step 02) may need a re-run, and any new column must be added to `src/lib/maps/tacLayerConfig.js` (the notebooks print legend breaks to paste there).

**Downloads required** (large, git-ignored): the StatCan Census Profile CSVs, the ADA (`lada000b21a_e`) and census tract (`lct_000b21a_e`) boundary files into `data/geo/`, the custom creative-worker extract in `data/census/noc-naics/`, and the TTS file in `data/census/tts/`.
