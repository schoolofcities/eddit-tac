"""
Fetch isochrones for every venue in venues-centroids.geojson from OTP,
sampled across a date x time grid, then aggregate via a frequency
threshold (see generate_isochrones.py for the method
explanation) and donut the result — for four base categories plus two
additional pooled outputs, six files total:

  weekday_peak, weekday_offpeak, weekend_peak, weekend_offpeak
  peak_all      (weekday_peak + weekend_peak pooled together)
  offpeak_all   (weekday_offpeak + weekend_offpeak pooled together)

The four base categories keep weekday and weekend fully separate. The
two "_all" outputs are additional, pooled views on top of that — see
the COMBINED_OUTPUTS note below for the caveat on what pooling does.

THRESHOLD SEMANTICS (per category, over that category's own samples):
  threshold ~ 0.0  ->  behaves like UNION      (reachable on any sample)
  threshold = 0.5  ->  "typical" / median reachability
  threshold ~ 1.0  ->  behaves like INTERSECTION (reachable on every sample)

DATES — single date per category, not a date range:
  Weekday: 2026-06-10 (Wed) — within the confirmed GO/TTC/UP overlap
  window (all three feeds have exception entries covering this date).
  Weekend: 2026-06-13 (Sat) — NOT confirmed. TTC's calendar_dates.txt
  only lists weekday exceptions (June 8-12, 15-19); no weekend date
  has been verified against TTC's actual service calendar. Treat
  weekend output as provisional until that's confirmed.

  With only one date per category, "aggregation" here only averages
  across sampled times-of-day within that single day, not across
  multiple days — a narrower version of the method than the
  multi-date design this script was originally built for.

Install deps:  pip install requests geopandas shapely rasterio numpy --break-system-packages
"""

import requests
import json
import os

import numpy as np
import geopandas as gpd
from shapely.ops import unary_union
from shapely.validation import make_valid
from shapely.geometry import GeometryCollection, MultiPolygon, Polygon, shape
import rasterio
from rasterio.features import rasterize, shapes as raster_shapes
from rasterio.transform import from_origin

# ---------------------------------------------------------------------
# CONFIG — edit these for your setup
# ---------------------------------------------------------------------
OTP_BASE_URL = "http://localhost:8080/otp/routers/toronto/isochrone"

VENUES_GEOJSON = "../../data/venues/tac-list/venues-centroids.geojson"
ID_FIELD = "id"

MODES = "WALK,TRANSIT"
CUTOFFS_SEC = [900, 1800, 2700, 3600]   # 15/30/45/60 min
MAX_WALK_DISTANCE = 1200
PRECISION_METERS = 50

THRESHOLD = 0.5                   # 0.0 = union, 1.0 = intersection, 0.5 = "typical"
GRID_CELL_SIZE_METERS = 25
WORKING_CRS = "EPSG:32617"        # UTM zone 17N — good metric CRS for Toronto
SIMPLIFY_TOLERANCE_METERS = 25

CHECKPOINT_EVERY = 10   # write checkpoint to disk every N requests within a category

# --- dates ---
# NOTE: single-date sampling per category — this collapses the
# date-averaging part of the method to just time-of-day averaging.
# June 10 (Wed) is within the confirmed TTC/GO/UP overlap window.
# June 13 (Sat) is NOT confirmed — TTC's calendar_dates.txt only
# covers weekdays (June 8-12, 15-19); no weekend date has been
# verified against TTC's actual calendar yet.
WEEKDAY_DATES = ["2026-06-10"]

WEEKEND_DATES = ["2026-06-13"]

# --- time windows ---
WEEKDAY_MORNING_PEAK = ["06:30:00", "07:00:00", "07:30:00", "08:00:00",
                        "08:30:00", "09:00:00", "09:30:00", "10:00:00"]
WEEKDAY_MIDDAY_OFFPEAK = ["11:00:00", "11:30:00", "12:00:00",
                          "12:30:00", "13:00:00", "13:30:00"]
WEEKDAY_EVENING_PEAK = ["15:30:00", "16:00:00", "16:30:00", "17:00:00",
                        "17:30:00", "18:00:00", "18:30:00", "19:00:00"]
WEEKDAY_NIGHT_OFFPEAK = ["22:00:00", "22:30:00", "23:00:00", "23:30:00"]

WEEKEND_MORNING_OFFPEAK = ["07:30:00", "08:00:00", "08:30:00", "09:00:00", "09:30:00"]
WEEKEND_MIDDAY_EVENING_PEAK = ["11:00:00", "11:30:00", "12:00:00", "12:30:00",
                               "13:00:00", "13:30:00", "14:00:00", "14:30:00",
                               "15:00:00", "15:30:00", "16:00:00", "16:30:00",
                               "17:00:00", "17:30:00", "18:00:00", "18:30:00", "19:00:00"]
WEEKEND_NIGHT_OFFPEAK = ["21:30:00", "22:00:00", "22:30:00", "23:00:00", "23:30:00"]

# --- category definitions: dates x times x output path ---
CATEGORIES = {
    "weekday_peak": {
        "dates": WEEKDAY_DATES,
        "times": WEEKDAY_MORNING_PEAK + WEEKDAY_EVENING_PEAK,
        "output": "../../data/mobility/isochrones_weekday_peak.geojson",
    },
    "weekday_offpeak": {
        "dates": WEEKDAY_DATES,
        "times": WEEKDAY_MIDDAY_OFFPEAK + WEEKDAY_NIGHT_OFFPEAK,
        "output": "../../data/mobility/isochrones_weekday_offpeak.geojson",
    },
    "weekend_peak": {
        "dates": WEEKEND_DATES,
        "times": WEEKEND_MIDDAY_EVENING_PEAK,
        "output": "../../data/mobility/isochrones_weekend_peak.geojson",
    },
    "weekend_offpeak": {
        "dates": WEEKEND_DATES,
        "times": WEEKEND_MORNING_OFFPEAK + WEEKEND_NIGHT_OFFPEAK,
        "output": "../../data/mobility/isochrones_weekend_offpeak.geojson",
    },
}

# Edit this to run a subset, e.g. ["weekday_peak"], if you want to run
# categories one at a time rather than all four in one long execution.
RUN_CATEGORIES = list(CATEGORIES.keys())

# --- combined outputs: pool weekday + weekend together ---
# NOTE: this pools two different service patterns (weekday vs weekend)
# into one threshold. Per the earlier discussion, that can blend two
# genuinely different schedules into a result that represents neither
# cleanly — these are ADDITIONAL outputs alongside the four separate
# ones above, not a replacement for them.
COMBINED_OUTPUTS = {
    "peak_all": {
        "source_categories": ["weekday_peak", "weekend_peak"],
        "output": "../../data/mobility/isochrones_peak_all.geojson",
    },
    "offpeak_all": {
        "source_categories": ["weekday_offpeak", "weekend_offpeak"],
        "output": "../../data/mobility/isochrones_offpeak_all.geojson",
    },
}
# ---------------------------------------------------------------------


def load_venues(path, id_field):
    with open(path) as f:
        data = json.load(f)

    venues = []
    for i, feature in enumerate(data["features"]):
        geom = feature["geometry"]
        if geom["type"] != "Point":
            print(f"  Skipping feature {i}: geometry type '{geom['type']}' is not Point")
            continue
        lon, lat = geom["coordinates"][0], geom["coordinates"][1]
        venue_id = feature.get("properties", {}).get(id_field, i)
        venues.append({"id": venue_id, "lat": lat, "lon": lon})

    return venues


def fetch_isochrone(lat, lon, modes, date, time_, cutoffs_sec, max_walk_distance, precision_meters):
    params = [
        ("fromPlace", f"{lat},{lon}"),
        ("mode", modes),
        ("date", date),
        ("time", time_),
        ("maxWalkDistance", max_walk_distance),
        ("precisionMeters", precision_meters),
    ]
    for c in cutoffs_sec:
        params.append(("cutoffSec", c))

    resp = requests.get(OTP_BASE_URL, params=params, timeout=120)
    resp.raise_for_status()
    return resp.json()


def save_checkpoint(all_features, path):
    fc = {"type": "FeatureCollection", "features": all_features}
    tmp_path = path + ".tmp"
    with open(tmp_path, "w") as f:
        json.dump(fc, f)
    os.replace(tmp_path, path)


def fetch_category(venues, dates, times, checkpoint_path):
    all_features = []
    failed = []
    request_count = 0
    total_requests = len(venues) * len(dates) * len(times)

    for venue in venues:
        vid, lat, lon = venue["id"], venue["lat"], venue["lon"]

        for date in dates:
            for time_ in times:
                request_count += 1
                print(f"  [{request_count}/{total_requests}] venue_id={vid} "
                      f"date={date} time={time_}...", end=" ")

                try:
                    geojson = fetch_isochrone(
                        lat, lon, MODES, date, time_, CUTOFFS_SEC,
                        MAX_WALK_DISTANCE, PRECISION_METERS
                    )
                except requests.exceptions.RequestException as e:
                    print(f"FAILED: {e}")
                    failed.append((vid, date, time_))
                    continue

                features = geojson.get("features", [])
                if not features:
                    print("0 features returned")
                    failed.append((vid, date, time_))
                    continue

                for feature in features:
                    cutoff_sec = feature["properties"].get("time", 0)
                    feature["properties"]["venue_id"] = vid
                    feature["properties"]["cutoff_sec"] = cutoff_sec
                    feature["properties"]["cutoff_min"] = round(cutoff_sec / 60)
                    feature["properties"]["sample_date"] = date
                    feature["properties"]["sample_time"] = time_
                    all_features.append(feature)

                print(f"{len(features)} polygon(s)")

                if request_count % CHECKPOINT_EVERY == 0:
                    save_checkpoint(all_features, checkpoint_path)

    print(f"\n  Fetched {len(all_features)} total polygons across "
          f"{total_requests - len(failed)}/{total_requests} (venue, date, time) requests")
    if failed:
        print(f"  Failed/empty combos: {failed}")

    return all_features


def _to_polygonal(geom):
    if isinstance(geom, (Polygon, MultiPolygon)):
        return geom
    if isinstance(geom, GeometryCollection):
        polys = [g for g in geom.geoms if isinstance(g, (Polygon, MultiPolygon))]
        if not polys:
            return Polygon()
        return unary_union(polys)
    return Polygon()


def threshold_aggregate(all_features, n_samples):
    """
    For each (venue_id, cutoff_sec) group, rasterize every sample's
    polygon onto a shared grid, sum reachability counts, threshold the
    resulting fraction, and vectorize back to polygon(s) in EPSG:4326.
    """
    gdf = gpd.GeoDataFrame.from_features(all_features, crs="EPSG:4326")
    gdf_metric = gdf.to_crs(WORKING_CRS)

    aggregated_rows = []
    groups = list(gdf_metric.groupby(["venue_id", "cutoff_sec"]))

    for i, ((venue_id, cutoff_sec), group) in enumerate(groups, start=1):
        geoms = [g if g.is_valid else _to_polygonal(make_valid(g)) for g in group.geometry]
        geoms = [g for g in geoms if not g.is_empty]

        if not geoms:
            continue

        minx, miny, maxx, maxy = unary_union(geoms).bounds
        pad = GRID_CELL_SIZE_METERS
        minx, miny, maxx, maxy = minx - pad, miny - pad, maxx + pad, maxy + pad

        width = max(1, int(np.ceil((maxx - minx) / GRID_CELL_SIZE_METERS)))
        height = max(1, int(np.ceil((maxy - miny) / GRID_CELL_SIZE_METERS)))
        transform = from_origin(minx, maxy, GRID_CELL_SIZE_METERS, GRID_CELL_SIZE_METERS)

        accumulator = np.zeros((height, width), dtype=np.uint16)
        for geom in geoms:
            mask = rasterize(
                [(geom, 1)], out_shape=(height, width), transform=transform,
                fill=0, dtype=np.uint8,
            )
            accumulator += mask

        fraction = accumulator / n_samples
        binary = (fraction >= THRESHOLD).astype(np.uint8)

        if binary.max() == 0:
            print(f"    [{i}/{len(groups)}] venue_id={venue_id} cutoff={cutoff_sec}s: "
                  f"no cells met the {THRESHOLD:.0%} threshold, skipping")
            continue

        polys = [
            shape(geom_dict).simplify(SIMPLIFY_TOLERANCE_METERS)
            for geom_dict, value in raster_shapes(binary, mask=(binary == 1), transform=transform)
            if value == 1
        ]
        merged = unary_union(polys)

        row = group.iloc[0].copy()
        row.geometry = merged
        row["sample_date"] = f"threshold_{THRESHOLD:.0%}_of_{n_samples}_samples"
        row["sample_time"] = ""
        aggregated_rows.append(row)

    aggregated_gdf = gpd.GeoDataFrame(aggregated_rows, crs=WORKING_CRS).to_crs("EPSG:4326")
    print(f"  Threshold aggregation: {len(aggregated_gdf)} (venue, cutoff) bands "
          f"at >= {THRESHOLD:.0%} reachability across {n_samples} sampled (date, time) combos")
    return aggregated_gdf


def make_donuts(gdf, output_path):
    gdf["geometry"] = gdf["geometry"].apply(
        lambda g: g if g.is_valid else _to_polygonal(make_valid(g))
    )

    donut_rows = []
    skipped = []

    for venue_id, group in gdf.groupby("venue_id"):
        group_sorted = group.sort_values("cutoff_sec")
        covered = None

        for _, row in group_sorted.iterrows():
            geom = row.geometry
            donut_geom = geom if covered is None else geom.difference(covered)

            if donut_geom.is_empty:
                skipped.append((venue_id, row["cutoff_sec"]))
            else:
                new_row = row.copy()
                new_row.geometry = donut_geom
                donut_rows.append(new_row)

            covered = geom if covered is None else unary_union([covered, geom])

    donut_gdf = gpd.GeoDataFrame(donut_rows, crs="EPSG:4326")
    donut_gdf.to_file(output_path, driver="GeoJSON")

    print(f"  Donut step: wrote {len(donut_gdf)} features -> {output_path}")
    if skipped:
        print(f"    Note: {len(skipped)} band(s) had no incremental area and were dropped: {skipped}")


def main():
    venues = load_venues(VENUES_GEOJSON, ID_FIELD)
    print(f"Loaded {len(venues)} venue points from {VENUES_GEOJSON}\n")

    fetched_features = {}   # category_name -> raw features, kept for the combined step below
    n_samples_by_category = {}

    for category_name in RUN_CATEGORIES:
        cfg = CATEGORIES[category_name]
        dates, times, output_path = cfg["dates"], cfg["times"], cfg["output"]
        n_samples = len(dates) * len(times)
        checkpoint_path = f".isochrones_checkpoint_{category_name}.geojson"

        print(f"=== {category_name} ===")
        print(f"  {len(dates)} dates x {len(times)} times = {n_samples} samples/venue "
              f"({n_samples * len(venues)} total requests)\n")

        all_features = fetch_category(venues, dates, times, checkpoint_path)
        fetched_features[category_name] = all_features
        n_samples_by_category[category_name] = n_samples

        if not all_features:
            print(f"  No features for {category_name} — skipping aggregation/donut.\n")
            continue

        aggregated_gdf = threshold_aggregate(all_features, n_samples)

        if len(aggregated_gdf) == 0:
            print(f"  No bands met threshold for {category_name} — skipping donut.\n")
            continue

        make_donuts(aggregated_gdf, output_path)

        if os.path.exists(checkpoint_path):
            os.remove(checkpoint_path)

        print()

    print("All individual categories complete.\n")

    # --- combined outputs: pool weekday + weekend for peak and offpeak ---
    for combined_name, combined_cfg in COMBINED_OUTPUTS.items():
        source_categories = combined_cfg["source_categories"]

        if not all(c in fetched_features for c in source_categories):
            print(f"=== {combined_name} ===\n"
                  f"  Skipping — not all source categories "
                  f"({source_categories}) were run this session.\n")
            continue

        print(f"=== {combined_name} (pooled from {' + '.join(source_categories)}) ===")

        pooled_features = []
        pooled_n_samples = 0
        for c in source_categories:
            pooled_features.extend(fetched_features[c])
            pooled_n_samples += n_samples_by_category[c]

        if not pooled_features:
            print(f"  No features to pool for {combined_name} — skipping.\n")
            continue

        print(f"  Pooled {pooled_n_samples} total samples/venue across "
              f"{len(source_categories)} source categories\n")

        aggregated_gdf = threshold_aggregate(pooled_features, pooled_n_samples)

        if len(aggregated_gdf) == 0:
            print(f"  No bands met threshold for {combined_name} — skipping donut.\n")
            continue

        make_donuts(aggregated_gdf, combined_cfg["output"])
        print()

    print("All categories and combined outputs complete.")


if __name__ == "__main__":
    main()
