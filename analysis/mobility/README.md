# Transit Isochrone Aggregation (OTP)

Computes transit accessibility isochrones for a set of venues in Toronto
using OpenTripPlanner 1.x, aggregated across multiple sampled departure
times via a frequency-threshold method, and split into weekday/weekend and
peak/off-peak categories.

This repository contains one script: `generate_isochrones_peak_offpeak.py`.

---

## 1. Prerequisites

### 1.1 Java

OTP 1.5.0 requires **Java 8** specifically. Check your version:

```bash
java -version
```

OTP1 does not run reliably on Java 11+. If your default JDK is newer,
install and select Java 8 for this project before proceeding.

### 1.2 OpenTripPlanner 1.5.0

Download the shaded jar:

```bash
curl -o otp-1.5.0-shaded.jar \
  https://repo1.maven.org/maven2/org/opentripplanner/otp/1.5.0/otp-1.5.0-shaded.jar
```

### 1.3 Python

Python 3, with all dependencies this script requires:

```bash
pip install requests geopandas shapely rasterio numpy --break-system-packages
```

On macOS, the command is `python3`, not `python` — `python` is usually not
aliased and will fail with `command not found`.

### 1.4 Input data

You will need, in a working directory of your choice:

- **GTFS feeds** for the transit agencies you want routed (e.g. one zip
  per agency). Avoid spaces or special characters in filenames.
- **An OSM extract** covering the same area, in `.osm.pbf` format.
- **`venues-centroids.geojson`** — a GeoJSON `FeatureCollection` of Point
  features, one per venue, each with an `id` property (or whichever
  property name you set `ID_FIELD` to in the script). Example:

  ```json
  {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": { "id": "1" },
        "geometry": { "type": "Point", "coordinates": [-79.3832, 43.6532] }
      }
    ]
  }
  ```

---

## 2. Building the OTP graph

Place your OSM extract and all GTFS feeds in one directory, e.g.:

```
graphs/
└── toronto/
    ├── city.osm.pbf
    ├── agency1-gtfs.zip
    ├── agency2-gtfs.zip
    └── agency3-gtfs.zip
```

Build the graph:

```bash
java -Xmx4G -jar otp-1.5.0-shaded.jar --build graphs/toronto
```

This writes `Graph.obj` into `graphs/toronto/` and generates a build
report at `graphs/toronto/build-report/report.html`. Check that report
for feed-linking errors (e.g. overlapping stop/trip IDs across agencies)
before proceeding — these can silently degrade routing without failing
the build.

If the build runs out of memory, increase `-Xmx` (e.g. `-Xmx6G` or `-Xmx8G`).

---

## 3. Running the pipeline

This requires **two terminals running concurrently**: one hosting the OTP
server, one running the Python script that queries it.

### Terminal 1 — start the OTP server

```bash
java -Xmx4G -jar otp-1.5.0-shaded.jar --graphs graphs --router toronto --server --port 8080
```

Wait for a log line indicating the server is running (e.g. `Grizzly server
running`) before proceeding — this can take a minute or two for a
multi-feed regional graph. Leave this terminal open for the duration of
the run.

### Terminal 2 — run the script

Once the server is confirmed up, in a separate terminal:

```bash
python3 generate_isochrones_peak_offpeak.py
```

The script queries OTP once for each (venue, date, time) combination
across four sampling categories — `weekday_peak`, `weekday_offpeak`,
`weekend_peak`, `weekend_offpeak` — then computes two additional pooled
outputs. See Section 6 (Methodology) for the full procedure.

Expect a long runtime: each isochrone computation is CPU-bound on the OTP
side, and the total request count is `venues × dates × times` per
category, summed across all four categories.

### Shutting down

Once the script completes, return to Terminal 1 and stop the server with
`Ctrl+C`.

---

## 4. Output files

Six GeoJSON files are produced:

- `isochrones_weekday_peak.geojson`
- `isochrones_weekday_offpeak.geojson`
- `isochrones_weekend_peak.geojson`
- `isochrones_weekend_offpeak.geojson`
- `isochrones_peak_all.geojson` (weekday + weekend peak pooled)
- `isochrones_offpeak_all.geojson` (weekday + weekend off-peak pooled)

Each is a `FeatureCollection` where each feature is one non-overlapping
band for one venue at one cutoff. See Section 6.7 for the full schema.

### Resuming a partial run

If execution is interrupted (e.g. the OTP server terminates mid-run), the
four base categories do not need to be rerun from scratch. Each maintains
its own checkpoint file (`.isochrones_checkpoint_<category>.geojson`)
during fetching, and `RUN_CATEGORIES` near the top of the script can be
set to just the incomplete category:

```python
RUN_CATEGORIES = ["weekend_offpeak"]
```

Note: the two pooled outputs (`peak_all`, `offpeak_all`) are only
generated if all of their source categories were executed within the same
run. Running a single category in isolation will not regenerate a pooled
output on its own.

---

## 5. Troubleshooting

- **`command not found: python`** — use `python3`.
- **All requests fail with `Connection refused`** — the OTP server is not
  running or has not finished loading the graph. Confirm Terminal 1 shows
  the server-running log line before starting the script.
- **`GEOSException: TopologyException`** — the script repairs invalid
  polygon geometries automatically before performing union/difference
  operations. If this persists, it typically indicates a degenerate
  polygon returned by OTP for a specific venue; verify that venue's
  coordinates fall within the graph's street network.
- **0 features returned for a venue** — typically indicates no transit
  service reaches that point at the queried date/time (e.g. outside a
  feed's service area, or the date falls outside a feed's calendar
  validity range).
- **Output geometry appears blocky** — see Section 6.8 (Boundary geometry).

---

## 6. Methodology

### 6.1 Rationale for multi-sample departure aggregation

A transit isochrone computed at a single departure time is sensitive to
schedule-specific timing effects: the resulting reachable-area polygon is
conditional on the alignment between the queried departure time and the
nearest scheduled service. A shift of the query time by 10 minutes can
produce a measurably different polygon at the boundary, independent of any
change to the underlying network or schedule. To reduce this sensitivity,
the method samples departure times across defined windows and aggregates
the resulting set of isochrones into a single representative polygon per
venue per cutoff.

### 6.2 Aggregation method: frequency threshold

For each cutoff band (10/20/30/40/50 minutes), the procedure is:

1. Query OTP for an isochrone at each sampled (date, time) combination.
2. Rasterize each resulting polygon onto a common grid.
3. Compute, per grid cell, the count of samples for which the cell falls
   within the isochrone.
4. Normalize by total sample count to obtain a reachability fraction
   in [0, 1] per cell.
5. Apply a binary threshold: retain cells with fraction ≥ `THRESHOLD`
   (default 0.5).
6. Vectorize the retained cell set into a polygon.

At `THRESHOLD = 0.5`, a cell is classified as reachable if at least half of
the sampled departures reach it within the cutoff — a median-based
reachability criterion:

```
THRESHOLD = 0.5  ->  median reachability across sampled departures
```

### 6.3 Non-overlapping band construction (donut operation)

OTP isochrone output is cumulative: the polygon for a given cutoff is a
superset of the polygon for any smaller cutoff, since the reachable set is
monotonically non-decreasing in time. Post-aggregation, the procedure
computes, for each venue, the set-difference between each band's polygon
and the union of all smaller-cutoff bands, yielding a partition of the
total reachable area into disjoint annuli — e.g. the region reachable
within 20–30 minutes but not within 20 minutes. The smallest cutoff band
(10 minutes) is retained unmodified, as no smaller band exists to subtract.

### 6.4 Sampling windows

Weekday and weekend service patterns are treated as distinct populations
and sampled independently. Each is stratified into peak and off-peak
subcategories:

| Category | Time windows | Sample count |
|---|---|---|
| Weekday peak | 06:30–10:00, 15:30–19:00 | 16 |
| Weekday off-peak | 11:00–13:30, 22:00–23:30 | 10 |
| Weekend peak | 11:00–19:00 | 17 |
| Weekend off-peak | 07:30–09:30, 21:30–23:30 | 10 |

Sampling interval: 30 minutes, uniform across all windows.

### 6.5 Dates

| Category | Date | Calendar status |
|---|---|---|
| Weekday | 2026-06-10 (Wednesday) | Verified — falls within the overlapping service-date range confirmed across all three feeds (GO, TTC, UP) |
| Weekend | 2026-06-13 (Saturday) | Unverified — TTC calendar data available covers weekdays only (2026-06-08 through 2026-06-19, excluding weekends); no weekend date has been confirmed against TTC's service calendar |

A single date is used per category rather than a date range. Consequently,
aggregation in the current configuration averages over intra-day departure
time only; inter-day variation is not represented. Extending to multiple
dates per category would require additional confirmed calendar coverage.

### 6.6 Output files

Four outputs correspond to the base categories, computed independently:

- `isochrones_weekday_peak.geojson`
- `isochrones_weekday_offpeak.geojson`
- `isochrones_weekend_peak.geojson`
- `isochrones_weekend_offpeak.geojson`

Two additional outputs are computed by pooling the sample sets of the
corresponding weekday and weekend categories prior to thresholding:

- `isochrones_peak_all.geojson` (weekday-peak ∪ weekend-peak sample pool)
- `isochrones_offpeak_all.geojson` (weekday-offpeak ∪ weekend-offpeak sample pool)

Pooling combines two populations with potentially distinct service
frequency distributions into a single threshold calculation. The resulting
polygon reflects the combined sample set and does not correspond
independently to either the weekday-only or weekend-only result.

### 6.7 Output schema

Each output file is a GeoJSON `FeatureCollection`. Each feature represents
one non-overlapping band for one venue at one cutoff. Feature properties:

| Property | Description |
|---|---|
| `venue_id` | Venue identifier |
| `cutoff_sec` / `cutoff_min` | Cutoff band, in seconds and minutes |
| `sample_date` | Set to a string of the form `threshold_50%_of_N_samples`, indicating aggregation parameters rather than a calendar date |
| `sample_time` | Empty string; not applicable post-aggregation |

### 6.8 Parameters

| Parameter | Value | Function |
|---|---|---|
| `MODES` | `WALK,TRANSIT` | Permitted travel modes for OTP routing |
| `CUTOFFS_SEC` | 600, 1200, 1800, 2400, 3000 | Cutoff bands, in seconds (10/20/30/40/50 min) |
| `MAX_WALK_DISTANCE` | 1200 m | Maximum permitted walking distance per leg |
| `PRECISION_METERS` | 50 | Resolution of OTP's internal isochrone contour computation |
| `THRESHOLD` | 0.5 | Reachability fraction cutoff; see Section 6.2 |
| `GRID_CELL_SIZE_METERS` | 25 | Cell size of the rasterization grid |
| `WORKING_CRS` | EPSG:32617 (UTM Zone 17N) | Projected coordinate system used for metric grid operations |
| `SIMPLIFY_TOLERANCE_METERS` | 25 | Polygon simplification tolerance post-vectorization; set equal to `GRID_CELL_SIZE_METERS` |

### 6.9 Limitations

- **Temporal resolution of sampling.** A single date per category limits
  the aggregation to intra-day variation; inter-day variation is not
  captured in the current configuration.
- **Pooled-output interpretation.** See Section 6.6 regarding the
  combination of distinct service populations in `peak_all` and
  `offpeak_all`.
- **Threshold-grid interaction.** Grid resolution and threshold value
  jointly determine boundary behavior near marginal reachability; grid
  resolution should be held constant when comparing outputs across
  threshold values.

### 6.10 Configuration reference

Additional script-level configuration, beyond the parameters in Section 6.8:

| Variable | Description |
|---|---|
| `VENUES_GEOJSON` | Input points file path |
| `ID_FIELD` | Property name used as venue identifier |
| `WEEKDAY_DATES`, `WEEKEND_DATES` | Sampled dates per day-type |
| `WEEKDAY_MORNING_PEAK`, `WEEKDAY_MIDDAY_OFFPEAK`, etc. | Time windows per category |
| `RUN_CATEGORIES` | Subset of base categories to execute in a given run |
| `COMBINED_OUTPUTS` | Source categories feeding each pooled output |