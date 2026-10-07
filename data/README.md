# `data/` -- raw and intermediate data

Inputs downloaded from outside, and intermediate results of the analysis notebooks. **Final outputs consumed by the web app are not kept here** -- they live in `src/data/` (and `static/` for PMTiles); see `src/data/README.md`.

| Folder | Contents | In git? |
|---|---|---|
| `activity/` | Cuebiq query outputs (`venue_stops.csv`, `venues_homes.csv`, ...), ward-level tables (`wards/`), exploration outputs (`explore/`) | **No** -- licensed data, raw counts must not be published |
| `census/ada/` | Census Profile extract per ADA (`toronto-ada.csv`) | partly (the big raw CSV is ignored) |
| `census/ada-wide/` | ADA tables with one column per variable, and the intermediate TTS / creative-worker versions | yes |
| `census/noc-naics/` | custom StatCan creative-worker extract (raw parquet, `toronto-tract-noc-naics.csv`) | raw ignored |
| `census/tts/`, `census/wards/` | TTS zones; ward census tables | partly |
| `geo/` | boundaries (ADA, census tracts, lake, GTA CSDs), `Toronto.osm.pbf`, GTFS zips, Toronto geohash lists | partly |
| `mobility/` | OTP isochrones (`isochrones_*.geojson`); `otp-graphs/` and `walk-graph/` are scratch and ignored | isochrones yes |
| `venues/` | `venues_geohash9.csv`, TAC list CSVs (`tac-list/`), OSM and Axle exploration (`osm/`, `axle/`) | partly |
| `archive/unused-layers/` | layers retired from the app (kept in git) | yes |

Which notebook reads or writes each folder is listed at the top of every notebook and in `analysis/README.md`.
Large downloads (StatCan Census Profile CSVs, boundary shapefiles, the creative-worker extract) are git-ignored; the notebooks that need them say where to put them.
