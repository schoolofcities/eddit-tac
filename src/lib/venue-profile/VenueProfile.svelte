<script>
	import LineChart from "./LineChart.svelte";
	import ProportionalBar from "./ProportionalBar.svelte";
	import {
		getVenueMetrics,
		formatYearMonth,
		formatHalfYear,
	} from "./venueMetrics.js";

	let { venueId = null } = $props();

	const metrics = $derived(venueId ? getVenueMetrics(venueId) : null);

	// Fixed categorical order reused across every dual/multi-segment chart below:
	// blue = primary/first category, orange = secondary. Distance buckets get
	// their own near->far sequential ramp, reused from the map's choropleth scale.
	const ACCENT_BLUE = "rgb(0, 98, 234)";
	const ACCENT_ORANGE = "#EBA00F";
	const FAINT_BLUE = "rgba(0, 98, 234, 0.18)";
	const DISTANCE_RAMP = ["#99C2F8", "#4D92F1", "#0062EA", "#004EBB"];
	const DISTANCE_LABELS = ["<1km", "1-3km", "3-10km", "10km+"];

	const stopsSeries = $derived(
		metrics
			? [
					{
						id: "raw-stops",
						label: "Raw stops",
						color: ACCENT_BLUE,
						points: metrics.monthly_raw_stops.map((d) => ({
							x: formatYearMonth(d.year_month),
							y: d.value,
						})),
					},
					{
						id: "unique-devices",
						label: "Unique devices",
						color: ACCENT_ORANGE,
						points: metrics.monthly_unique_devices.map((d) => ({
							x: formatYearMonth(d.year_month),
							y: d.value,
						})),
					},
				]
			: [],
	);

	const repeatSeries = $derived(
		metrics
			? [
					{
						id: "repeat-visitors",
						label: "Repeat visitors",
						color: ACCENT_BLUE,
						points: metrics.repeat_visitor_pct.map((d) => ({
							x: formatHalfYear(d.half_year),
							y: d.value,
						})),
					},
				]
			: [],
	);

	const weekdaySegments = $derived(
		metrics
			? [
					{
						label: "Weekdays",
						value: metrics.weekday_weekend_split.weekday_pct,
						color: ACCENT_BLUE,
					},
					{
						label: "Weekends",
						value: metrics.weekday_weekend_split.weekend_pct,
						color: ACCENT_ORANGE,
					},
				]
			: [],
	);

	const dayEveningSegments = $derived(
		metrics
			? [
					{
						label: "Daytime (9-5)",
						value: metrics.daytime_evening_split.nine_five_pct,
						color: ACCENT_BLUE,
					},
					{
						label: "Evening",
						value: metrics.daytime_evening_split.evening_pct,
						color: ACCENT_ORANGE,
					},
				]
			: [],
	);

	const hhiSegments = $derived(
		metrics
			? [
					{
						label: "",
						value: metrics.home_origin_hhi * 100,
						color: ACCENT_BLUE,
					},
					{
						label: "",
						value: 100 - metrics.home_origin_hhi * 100,
						color: FAINT_BLUE,
					},
				]
			: [],
	);

	const distanceSegments = $derived(
		metrics
			? DISTANCE_LABELS.map((label, i) => ({
					label,
					value: metrics.travel_distance_distribution[label] ?? 0,
					color: DISTANCE_RAMP[i],
				}))
			: [],
	);
</script>

{#if metrics}
	<div class="venue-profile">
		<div class="metric-block">
			<h3 class="metric-heading">Monthly Activity</h3>
			<LineChart
				series={stopsSeries}
				yAxisLabel="Raw stops / unique devices (×1,000 prop.)"
				yFormat={(v) => v.toFixed(2)}
				xTickEvery={6}
			/>
		</div>

		<div class="metric-block">
			<h3 class="metric-heading">Repeat Visitors</h3>
			<LineChart
				series={repeatSeries}
				yAxisLabel="Repeat visitors (%)"
				yFormat={(v) => `${v.toFixed(0)}%`}
				xTickEvery={1}
			/>
		</div>

		<div class="metric-block">
			<h3 class="metric-heading">Weekday vs. Weekend</h3>
			<ProportionalBar
				segments={weekdaySegments}
				referenceLine={(5 / 7) * 100}
				referenceLabel="5/7 days"
			/>
		</div>

		<div class="metric-block">
			<h3 class="metric-heading">Daytime vs. Evening</h3>
			<ProportionalBar segments={dayEveningSegments} />
		</div>

		<div class="metric-block">
			<h3 class="metric-heading">Home-Origin Concentration</h3>
			<ProportionalBar segments={hhiSegments} showLegend={false} />
			<p class="metric-annotation">
				HHI <strong>{metrics.home_origin_hhi.toFixed(2)}</strong> — higher
				values indicate visitors are drawn from a smaller, more
				concentrated set of home areas.
			</p>
		</div>

		<div class="metric-block">
			<h3 class="metric-heading">Travel Distance</h3>
			<ProportionalBar segments={distanceSegments} />
		</div>
	</div>
{:else}
	<p class="empty-state">
		Activity metrics are not available for this venue.
	</p>
{/if}

<style>
	.venue-profile {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.metric-block {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.metric-heading {
		font-family: Montserrat, sans-serif;
		font-weight: bold;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--brandGray70);
		margin: 0;
	}

	.metric-annotation {
		font-size: 0.68rem;
		color: var(--brandGray60);
		line-height: 1.45;
		margin: 2px 0 0;
	}

	.empty-state {
		font-size: 0.73rem;
		color: var(--brandGray60);
		font-style: italic;
		margin: 0;
	}
</style>
