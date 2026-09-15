# Transit Isochrone Aggregation (OTP)

Computes transit accessibility isochrones for a set of venues in Toronto
using OpenTripPlanner 1.x, aggregated across multiple sampled departure
times via a frequency-threshold method, and split into weekday/weekend and
peak/off-peak categories, plus pooled composite views.

This repository contains one script: `otp_isochrones.py`.

**A note on directory structure.** Every path in this README (the jar,
`graphs/`, `data/`, `output-4/`) is relative to a single working
directory — call it the *project directory*. It doesn't need to be your
terminal's home directory or a top-level folder; it's fine for this to be
a subfolder inside some larger project (e.g. `big-project/transit-
isochrones/`). What matters is that you `cd` into that same project
directory before running any of the Java or Python commands below, in
every terminal you use — see Section 3 for exactly where.

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

Download the shaded jar into your project directory (see the note above —
`cd` there first):

```bash
curl -o otp-1.5.0-shaded.jar \
  https://repo1.maven.org/maven2/org/opentripplanner/otp/1.5.0/otp-1.5.0-shaded.jar
```

### 1.3 Python

Python 3, with all dependencies this script requires:

```bash
pip install requests geopandas shapely rasterio numpy pandas --break-system-packages
```

On macOS, the command is `python3`, not `python` — `python` is usually not
aliased and will fail with `command not found`.

### 1.4 Input data

You will need:

- **GTFS feeds** for the transit agencies you want routed (e.g. one zip
  per agency). Avoid spaces or special characters in filenames.
- **An OSM extract** covering the same area, in `.osm.pbf` format.
- **`../../data/venues/tac-list/venues-centroids.geojson`** (relative to
  the project directory — this one lives two levels up, in a shared
  `data/` folder outside this project, per `VENUES_GEOJSON` in the
  script) — a GeoJSON `FeatureCollection` of Point features, one per
  venue, each with an `id` property (or whichever property name you set
  `ID_FIELD` to in the script). Example:

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
    ├── Toronto.osm.pbf
    ├── GO-GTFS.zip
    ├── TTC-GTFS.zip
    └── UP-GTFS.zip
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
server, one running the Python script that queries it. Each terminal is a
separate shell session, so **each one needs its own `cd` into the project
directory** — one terminal's working directory doesn't carry over to the
other.

### Terminal 1 — start the OTP server

```bash
cd /path/to/your/project-directory   # e.g. big-project/transit-isochrones
java -Xmx4G -jar otp-1.5.0-shaded.jar --graphs graphs --router toronto --server --port 8080
```

Wait for a log line indicating the server is running (e.g. `Grizzly server
running`) before proceeding — this can take a minute or two for a
multi-feed regional graph. Leave this terminal open for the duration of
the run.

### Terminal 2 — run the script

Once the server is confirmed up, in a separate terminal:

```bash
cd /path/to/your/project-directory   # same directory as Terminal 1
python3 otp_isochrones.py
```

The script queries OTP once for each (venue, date, time) combination
across four sampling categories — `weekday_peak`, `weekday_offpeak`,
`weekend_peak`, `weekend_offpeak` — then computes three additional pooled
outputs on top of those. See Section 6 (Methodology) for the full
procedure.

Expect a long runtime: each isochrone computation is CPU-bound on the OTP
side, and the total request count is `venues × dates × times` per
category, summed across all four categories.

### Shutting down

Once the script completes, return to Terminal 1 and stop the server with
`Ctrl+C`.

---

## 4. Output files

Seven GeoJSON files are produced, written to `output-4/`:

- `isochrones_weekday_peak.geojson`
- `isochrones_weekday_offpeak.geojson`
- `isochrones_weekend_peak.geojson`
- `isochrones_weekend_offpeak.geojson`
- `isochrones_peak_all.geojson` (weekday + weekend peak pooled)
- `isochrones_offpeak_all.geojson` (weekday + weekend off-peak pooled)
- `isochrones_overall_typical.geojson` (all four base categories combined)

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

Note: each pooled output (`peak_all`, `offpeak_all`, `overall_typical`) is
only generated if all of its source categories were executed within the
same run. Running a single category in isolation will not regenerate a
pooled output on its own — `overall_typical` in particular needs all four
base categories present, since it draws on every one of them.

---

## 5. Troubleshooting

- **`command not found: python`** — use `python3`.
- **`Error: Unable to access jarfile otp-1.5.0-shaded.jar`** or the script
  can't find `graphs/` / `../../data/venues/tac-list/venues-centroids.geojson`
  — you're
  not in the project directory in that terminal. `cd` there first (see
  Section 3); remember each terminal needs this independently.
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
- **Output geometry appears blocky** — see Section 6.9 (Boundary geometry).

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

For each cutoff band (15/30/45/60 minutes), the base procedure is:

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

This base procedure is what produces each of the four independent
category outputs. The three pooled outputs (Section 6.6) build on it via
the pooling method described next.

### 6.3 Pooling method

Pooling combines samples from more than one category into a single
threshold calculation. Because the four base categories don't have equal
sample counts per venue (see Section 6.4), pooling them naively (summing
raw hits and dividing by the combined sample count) would let whichever
categories were sampled more densely dominate the result. To avoid that,
all three pooled outputs use **equal-weighted averaging**: each source
category's own reachability fraction is computed independently (that
category's hit-count divided by *its own* sample count), and those
per-category fractions are then averaged with equal weight before
thresholding:

```
typical_fraction = (1/N) * sum over categories of (category's own fraction)
```

Each category counts the same regardless of how many samples it
contributed — a category with 10 samples and a category with 17 samples
each get an equal 1/N vote. This holds by construction, not because the
source categories' sample counts happen to be close — so it keeps holding
even if a sample time is added to or removed from a window later.

Mechanically, this pooling (`threshold_aggregate_weighted` in the script)
works like this, per (venue, cutoff) group:

1. Build one shared raster grid from the combined bounding box of *all*
   source categories' geometries in that group, so every category's
   fraction is computed on identical pixel bounds and can be averaged
   directly.
2. For each source category independently: rasterize its own samples
   onto that shared grid, sum hits, and divide by that category's own
   sample count to get a per-cell fraction.
3. Average the per-category fraction rasters with equal weight.
4. Threshold the averaged fraction and vectorize to polygon(s), same as
   the base procedure.

A category with zero reachable cells for a given (venue, cutoff)
correctly contributes an all-zero fraction to the average, rather than
being dropped and inflating the remaining categories' share.

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

These counts are unequal across categories — and may change further if
sample times are added or removed from a window later. All three
combined outputs use equal-weighted pooling (Section 6.3) precisely so
that this doesn't require revisiting: each source category keeps its
stated share regardless of how many samples it happens to contain.

### 6.5 Dates

A single date is used per category rather than a date range. Consequently,
aggregation in the current configuration averages over intra-day departure
time only; inter-day variation is not represented. Extending to multiple
dates per category would require additional confirmed calendar coverage.

### 6.6 Output files

Four outputs correspond to the base categories, computed independently
via the base procedure (Section 6.2):

- `isochrones_weekday_peak.geojson`
- `isochrones_weekday_offpeak.geojson`
- `isochrones_weekend_peak.geojson`
- `isochrones_weekend_offpeak.geojson`

Three additional outputs are computed by pooling samples from multiple
base categories, per `COMBINED_OUTPUTS` in the script — all via
equal-weighted pooling (Section 6.3):

- `isochrones_peak_all.geojson` — equal-weighted average of weekday-peak
  and weekend-peak's own reachability fractions.
- `isochrones_offpeak_all.geojson` — equal-weighted average of
  weekday-offpeak and weekend-offpeak's own reachability fractions.
- `isochrones_overall_typical.geojson` — equal-weighted average of all
  four base categories' own reachability fractions.

Each source category contributes an equal share regardless of its sample
count; see Section 6.3 for the mechanics and Section 6.9 for the one
caveat equal-weighting does not resolve.

### 6.7 Output schema

Each output file is a GeoJSON `FeatureCollection`. Each feature represents
one non-overlapping band for one venue at one cutoff. Feature properties:

| Property | Description |
|---|---|
| `venue_id` | Venue identifier |
| `cutoff_sec` / `cutoff_min` | Cutoff band, in seconds and minutes |
| `sample_date` | For the four base categories: a string of the form `threshold_50%_of_N_samples`. For the three pooled outputs: a string of the form `equal_weighted_threshold_50%_of_N_categories`. Either way, this records aggregation parameters rather than a calendar date. |
| `sample_time` | Empty string; not applicable post-aggregation |

### 6.8 Parameters

| Parameter | Value | Function |
|---|---|---|
| `MODES` | `WALK,TRANSIT` | Permitted travel modes for OTP routing |
| `CUTOFFS_SEC` | 900, 1800, 2700, 3600 | Cutoff bands, in seconds (15/30/45/60 min) |
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
- **What equal-weighted pooling does and doesn't fix.** Equal-weighting
  removes sample-count imbalance as a source of bias in all three pooled
  outputs, but it doesn't address whether an equal share per category is
  the right notion of "typical" in the first place — e.g. for
  `overall_typical`, an equal ¼ share does not correspond to the fraction
  of a real week that each regime actually occupies (peak windows and
  off-peak windows are not equal shares of a real week). It answers
  "reachable across a representative mix of the source regimes," not
  "reachable at a randomly chosen moment during an average week." If the
  latter is the intended meaning, weighting by each regime's real-world
  share of the week rather than equally would be a different (and not
  currently implemented) method.
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
| `COMBINED_OUTPUTS` | Source categories and output path for each pooled output. All three are pooled via equal-weighted averaging (Section 6.3) — there's no method selector; every pooled output uses the same approach. |