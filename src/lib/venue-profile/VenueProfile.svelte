<script>
	import LineChart from "./LineChart.svelte";
	import ProportionalBar from "./ProportionalBar.svelte";
	import {
		getVenueMetrics,
		formatYearMonth,
		formatHalfYear,
	} from "./venueMetrics.js";
	import wardToVenueSummary from "$data/activity/ward_to_venue_summary.json";

	// layout: "stack" (one column, default) | "row" (blocks side by side,
	// each at a fixed width — used in the desktop venue strip)
	let { venueId = null, layout = "stack" } = $props();

	// Slimmer bars in the desktop strip, original height when stacked
	const barHeight = $derived(layout === "row" ? 14 : 22);

	// A venue with missing or malformed metrics must never throw: in Svelte 5
	// an error here aborts the whole update, so the map and dropdown would
	// stop responding too. Log it and show the empty state instead.
	function safeMetrics(id) {
		try {
			return getVenueMetrics(id) ?? null;
		} catch (err) {
			console.error(`[VenueProfile] could not load metrics for venue ${id}`, err);
			return null;
		}
	}

	const metrics = $derived(venueId ? safeMetrics(venueId) : null);

	// Missing / null values become 0, which the charts already treat as
	// "no data" (omitZero). A null reaching a chart would throw on toFixed.
	const num = (v) => (Number.isFinite(Number(v)) && v !== null ? Number(v) : 0);
	const fmt = (digits, suffix = "") => (v) =>
		Number.isFinite(v) ? `${v.toFixed(digits)}${suffix}` : "–";

	// Each chart has its own error boundary: a failing chart shows its error
	// in place (and in the console) while the other charts still render.
	function logChartError(chart, err) {
		console.error(`[VenueProfile] "${chart}" chart failed for venue ${venueId}:`, err);
	}

	// Series must be arrays; anything else (missing, or an object keyed by
	// period) is treated as empty rather than crashing on .map / .filter.
	const list = (v) => (Array.isArray(v) ? v : []);

	function safeFormat(fn, v) {
		try {
			return fn(v);
		} catch {
			return String(v ?? "");
		}
	}

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
						label: "Total stops",
						color: ACCENT_BLUE,
						points: list(metrics.monthly_raw_stops).map((d) => ({
							x: safeFormat(formatYearMonth, d?.year_month),
							y: num(d?.value),
						})),
					},
					{
						id: "unique-devices",
						label: "Unique devices",
						color: ACCENT_ORANGE,
						points: list(metrics.monthly_unique_devices).map((d) => ({
							x: safeFormat(formatYearMonth, d?.year_month),
							y: num(d?.value),
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
						points: list(metrics.repeat_visitor_pct).map((d) => ({
							x: safeFormat(formatHalfYear, d?.half_year),
							y: num(d?.value),
						})),
					},
				]
			: [],
	);

	// 0% half-years usually mean "no data that period", not "zero repeat
	// visitors" — so the chart hides those points/segments (via omitZero) and
	// falls back to a placeholder entirely when only one real value exists.
	const repeatHasEnoughData = $derived(
		list(metrics?.repeat_visitor_pct).filter((d) => num(d?.value) !== 0).length > 1,
	);

	const weekdaySegments = $derived(
		metrics
			? [
					{
						label: "Weekdays",
						value: num(metrics.weekday_weekend_split?.weekday_pct),
						color: ACCENT_BLUE,
					},
					{
						label: "Weekends",
						value: num(metrics.weekday_weekend_split?.weekend_pct),
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
						value: num(metrics.daytime_evening_split?.nine_five_pct),
						color: ACCENT_BLUE,
					},
					{
						label: "Evening",
						value: num(metrics.daytime_evening_split?.evening_pct),
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

	const wardSummary = $derived(
		venueId
			? (list(wardToVenueSummary).find(
					(row) => String(row.venue_id) === String(venueId),
				) ?? null)
			: null,
	);

	const wardOriginSegments = $derived(
		wardSummary
			? [
					{
						label: `Percentage of visits from within ${wardSummary.home_ward}`,
						value: num(wardSummary.pct_inside_ward) * 100,
						color: ACCENT_BLUE,
					},
					{
						label: `Percentage of visits from outside ${wardSummary.home_ward}`,
						value: num(wardSummary.pct_outside_ward) * 100,
						color: ACCENT_ORANGE,
					},
				]
			: [],
	);

	const distanceSegments = $derived(
		metrics
			? DISTANCE_LABELS.map((label, i) => ({
					label,
					value: num(metrics.travel_distance_distribution?.[label]),
					color: DISTANCE_RAMP[i],
				}))
			: [],
	);
</script>

{#snippet chartError(err)}
	<p class="chart-error">
		Chart error: {err?.message ?? String(err)}
	</p>
{/snippet}

{#if metrics}
	<div class="venue-profile" class:venue-profile--row={layout === "row"}>
		<div class="metric-block metric-block--chart">
			<h3 class="metric-heading">Monthly Activity</h3>
			<div class="chart-fill">
				<svelte:boundary failed={chartError} onerror={(err) => logChartError("Monthly Activity", err)}>
					<LineChart
						series={stopsSeries}
						yAxisLabel="Total stops / unique devices (sample-adjusted). Reflects relative change over time, not an actual visit count."
						yFormat={fmt(2)}
						xTickEvery={6}
						fill={layout === "row"}
					/>
				</svelte:boundary>
			</div>
		</div>

		<div class="metric-block metric-block--chart">
			<h3 class="metric-heading">Repeat Visitors</h3>
			{#if repeatHasEnoughData}
				<div class="chart-fill">
					<svelte:boundary failed={chartError} onerror={(err) => logChartError("Repeat Visitors", err)}>
						<LineChart
							series={repeatSeries}
							yAxisLabel="Repeat visitors (%)"
							yFormat={fmt(0, "%")}
							xTickEvery={1}
							omitZero
							fill={layout === "row"}
						/>
					</svelte:boundary>
				</div>
			{:else}
				<p class="metric-annotation">Not enough data.</p>
			{/if}
		</div>

		<!-- Bar charts are grouped in pairs: stacked in one column in the
		     row layout, and flattened back into the list in the stack layout. -->
		<div class="metric-pair">
			<div class="metric-block">
				<h3 class="metric-heading">Weekday vs. Weekend</h3>
				<svelte:boundary failed={chartError} onerror={(err) => logChartError("Weekday vs. Weekend", err)}>
					<ProportionalBar
						height={barHeight}
						segments={weekdaySegments}
						referenceLine={(5 / 7) * 100}
						referenceLabel="5/7 days"
					/>
				</svelte:boundary>
			</div>

			<div class="metric-block">
				<h3 class="metric-heading">Daytime vs. Evening</h3>
				<svelte:boundary failed={chartError} onerror={(err) => logChartError("Daytime vs. Evening", err)}>
					<ProportionalBar height={barHeight} segments={dayEveningSegments} />
				</svelte:boundary>
			</div>
		</div>

		<!-- <div class="metric-block">
			<h3 class="metric-heading">Home-Origin Concentration</h3>
			<ProportionalBar height={barHeight} segments={hhiSegments} showLegend={false} />
			<p class="metric-annotation">
				HHI <strong>{metrics.home_origin_hhi.toFixed(2)}</strong> — higher
				values indicate visitors are drawn from a smaller, more
				concentrated set of home areas.
			</p>
		</div> -->

		<div class="metric-pair">
			{#if wardSummary}
				<div class="metric-block">
					<h3 class="metric-heading">Ward Origin Visits</h3>
					<svelte:boundary failed={chartError} onerror={(err) => logChartError("Ward Origin Visits", err)}>
						<ProportionalBar height={barHeight} segments={wardOriginSegments} />
					</svelte:boundary>
				</div>
			{/if}

			<div class="metric-block">
				<h3 class="metric-heading">Travel Distance</h3>
				<svelte:boundary failed={chartError} onerror={(err) => logChartError("Travel Distance", err)}>
					<ProportionalBar height={barHeight} segments={distanceSegments} />
				</svelte:boundary>
			</div>
		</div>
	</div>
{:else}
	<p class="empty-state">
		Activity metrics are not available for this venue.
	</p>
{/if}

<style>
	/*
		One spacing scale shared by both layouts so headings, charts and
		columns all line up on the same rhythm.
	*/
	.venue-profile {
		--vp-heading-gap: 8px; /* heading → its chart */
		--vp-block-gap: 24px; /* chart → next heading */
		--vp-col-gap: 24px; /* space either side of a column rule */
		--vp-col-width: 360px;

		display: flex;
		flex-direction: column;
		gap: calc(var(--vp-block-gap) + 4px);
	}

	.metric-block {
		display: flex;
		flex-direction: column;
		gap: var(--vp-heading-gap);
		min-width: 0;
	}

	.metric-heading {
		font-family: Montserrat, sans-serif;
		font-weight: bold;
		font-size: 0.7rem;
		line-height: 1.2;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--brandGray70);
		margin: 0;
	}

	/* Stack layout: the pair wrapper disappears, so its blocks sit in the
	   column exactly as before. */
	.metric-pair {
		display: contents;
	}

	/* ── Row layout (desktop venue strip) ──────────────────────────────── */
	/*
		Equal-width columns on a grid, separated by thin rules. Every column
		starts at the same top edge and every heading sits on one line, so
		the first chart in each column begins at the same height.
	*/
	.venue-profile--row {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: var(--vp-col-width);
		align-items: stretch;
		gap: 0;
		width: max-content;
		flex: 1 1 auto;
		min-height: 0;
	}

	.venue-profile--row > .metric-block,
	.venue-profile--row > .metric-pair {
		box-sizing: content-box;
		padding: 0 var(--vp-col-gap);
		border-left: 1px solid var(--brandGray);
	}

	.venue-profile--row > :first-child {
		padding-left: 0;
		border-left: none;
	}

	/* Breathing room after the last column, so it doesn't sit flush
	   against the strip's edge (or the end of the sideways scroll). */
	.venue-profile--row > :last-child {
		padding-right: var(--vp-col-gap);
	}

	/* Two equal rows: each bar block gets half the column's height. A lone
	   block (no ward data) still takes only the top half. */
	.venue-profile--row .metric-pair {
		display: grid;
		grid-template-rows: repeat(2, minmax(0, 1fr));
		row-gap: var(--vp-block-gap);
	}

	.venue-profile--row .metric-pair > .metric-block {
		min-height: 0;
	}

	.venue-profile--row .metric-heading {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Line charts fill their column down to the bottom of the strip */
	.chart-fill {
		display: block;
	}

	.venue-profile--row .chart-fill {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}

	.metric-annotation {
		font-size: 0.68rem;
		color: var(--brandGray60);
		line-height: 1.45;
		margin: 2px 0 0;
	}

	.chart-error {
		font-size: 0.68rem;
		line-height: 1.4;
		color: #b3261e;
		margin: 0;
		word-break: break-word;
	}

	.empty-state {
		font-size: 0.73rem;
		color: var(--brandGray60);
		font-style: italic;
		margin: 0;
	}
</style>