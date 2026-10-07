# Prelim

Small preparatory notebooks that sit outside the main pipelines.

| Notebook | Purpose | Writes |
|---|---|---|
| `toronto_geohash_cover.ipynb` | Lists every geohash6 and geohash8 cell intersecting the City of Toronto. The Cuebiq query uses them to restrict devices to Toronto (geohash6) and to build city-wide comparison counts (geohash8). Only needs re-running if the boundary changes. | `data/geo/geohash/toronto_geohash6.csv`, `toronto_geohash8.csv` |
| `get_prelim_nocs_naics.ipynb` | An early ADA-level look at arts occupations (NOC) and industries (NAICS) from the standard Census Profile. **Superseded** by the custom tract-level extract (`analysis/census/02` -> `04`); nothing depends on it. | `data/census/ada/prelim-nocs-naics.gpkg` |
