/**
 * Lookup + formatting helpers for the per-venue activity metrics computed in
 * analysis/activity/compute_venue_activity_metrics.ipynb and exported to
 * src/data/venue_metrics.json.
 */
import venueMetricsData from "$data/venue_metrics.json";

const metricsById = new Map(
	venueMetricsData.map((v) => [String(v.venue_id), v]),
);

export function getVenueMetrics(venueId) {
	if (venueId === null || venueId === undefined) return null;
	return metricsById.get(String(venueId)) ?? null;
}

const MONTH_LABELS = [
	"Jan", "Feb", "Mar", "Apr", "May", "Jun",
	"Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "202307" -> "Jul '23" */
export function formatYearMonth(yearMonth) {
	const year = yearMonth.slice(0, 4);
	const monthIndex = Number(yearMonth.slice(4, 6)) - 1;
	return `${MONTH_LABELS[monthIndex]} '${year.slice(2)}`;
}

/** "2023H2" -> "H2 '23" */
export function formatHalfYear(halfYear) {
	const year = halfYear.slice(0, 4);
	const half = halfYear.slice(4);
	return `${half} '${year.slice(2)}`;
}
