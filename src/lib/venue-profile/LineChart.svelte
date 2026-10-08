<script>
	/**
	 * Small hand-rolled multi-series line chart (no chart library dependency,
	 * consistent with the rest of the panel's hand-built SVG legends).
	 */
	let {
		series = [], // [{ id, label, color, points: [{ x: string, y: number }] }]
		yFormat = (v) => v,
		yAxisLabel = "",
		xTickEvery = 6,
		height = 120, // plot height in px (ignored when `fill` is on)
		omitZero = false,
		fill = false, // plot grows to fill the height its container gives it
	} = $props();

	// The plot is drawn in real pixels at whatever size it's rendered,
	// so text and strokes never get stretched or squashed.
	let boxWidth = $state(0);
	let boxHeight = $state(0);

	const width = $derived(boxWidth || 300);
	const plotBoxHeight = $derived(fill && boxHeight ? boxHeight : height);
	const padding = { top: 8, right: 8, bottom: 22, left: 36 };

	const plotWidth = $derived(width - padding.left - padding.right);
	const plotHeight = $derived(
		Math.max(0, plotBoxHeight - padding.top - padding.bottom),
	);

	const xLabels = $derived(series[0]?.points.map((p) => p.x) ?? []);
	const n = $derived(xLabels.length);

	const allY = $derived(series.flatMap((s) => s.points.map((p) => p.y)));
	const yMax = $derived((Math.max(0, ...allY) || 1) * 1.15);
	const yMin = 0;

	function xPos(i) {
		if (n <= 1) return padding.left;
		return padding.left + (i / (n - 1)) * plotWidth;
	}

	function yPos(v) {
		const t = (v - yMin) / (yMax - yMin || 1);
		return padding.top + (1 - t) * plotHeight;
	}

	function linePath(points) {
		return points
			.map(
				(p, i) =>
					`${i === 0 ? "M" : "L"}${xPos(i).toFixed(2)},${yPos(p.y).toFixed(2)}`,
			)
			.join(" ");
	}

	// When omitZero is set, drop zero-value points from the line entirely and
	// connect the remaining non-zero points directly to each other — a 0 in
	// the middle of the series (missing data) is bridged over, not drawn as a
	// dip to the axis or as a break in the line.
	function linePathOmitZero(points) {
		return points
			.map((p, i) => ({ i, y: p.y }))
			.filter((p) => p.y !== 0)
			.map(
				(p, j) =>
					`${j === 0 ? "M" : "L"}${xPos(p.i).toFixed(2)},${yPos(p.y).toFixed(2)}`,
			)
			.join(" ");
	}

	const yTicks = $derived([0, yMax / 2, yMax]);

	const xTickIndices = $derived.by(() => {
		if (n === 0) return [];
		const idx = new Set([0, n - 1]);
		for (let i = 0; i < n; i += xTickEvery) idx.add(i);
		return [...idx].sort((a, b) => a - b);
	});
</script>

<div class="line-chart" class:line-chart--fill={fill}>
	<div
		class="plot"
		style={fill ? undefined : `height:${height}px`}
		bind:clientWidth={boxWidth}
		bind:clientHeight={boxHeight}
	>
	<svg
		viewBox={`0 0 ${width} ${plotBoxHeight}`}
		width={width}
		height={plotBoxHeight}
		class="chart-svg"
		role="img"
		aria-label={yAxisLabel || "Line chart"}
	>
		<!-- gridlines + y ticks -->
		{#each yTicks as tick (tick)}
			<line
				x1={padding.left}
				x2={width - padding.right}
				y1={yPos(tick)}
				y2={yPos(tick)}
				class="gridline"
			/>
			<text
				x={padding.left - 4}
				y={yPos(tick) + 3}
				class="axis-tick"
				text-anchor="end">{yFormat(tick)}</text
			>
		{/each}

		<!-- x-axis baseline -->
		<line
			x1={padding.left}
			x2={width - padding.right}
			y1={plotBoxHeight - padding.bottom}
			y2={plotBoxHeight - padding.bottom}
			class="axis-line"
		/>

		<!-- x ticks -->
		{#each xTickIndices as i (i)}
			<text
				x={xPos(i)}
				y={plotBoxHeight - padding.bottom + 13}
				class="axis-tick"
				text-anchor="middle">{xLabels[i]}</text
			>
		{/each}

		<!-- series -->
		{#each series as s (s.id)}
			<path
				d={omitZero ? linePathOmitZero(s.points) : linePath(s.points)}
				stroke={s.color}
				stroke-width="1.75"
				stroke-linecap="round"
				stroke-linejoin="round"
				fill="none"
			/>
			{#each s.points as p, i (i)}
				{#if !omitZero || p.y !== 0}
					<circle cx={xPos(i)} cy={yPos(p.y)} r="1.7" fill={s.color}>
						<title>{xLabels[i]}: {yFormat(p.y)}</title>
					</circle>
				{/if}
			{/each}
		{/each}
	</svg>
	</div>

	{#if yAxisLabel}
		<p class="axis-caption">{yAxisLabel}</p>
	{/if}

	{#if series.length > 1}
		<div class="chart-legend">
			{#each series as s (s.id)}
				<span class="legend-item">
					<span
						class="legend-swatch"
						style={`background:${s.color}`}
					></span>
					{s.label}
				</span>
			{/each}
		</div>
	{/if}
</div>

<style>
	.line-chart {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	/* Fill mode: the plot takes whatever height is left after the caption
	   and legend. The svg is absolutely positioned so its own size never
	   feeds back into the measurement. */
	.line-chart--fill {
		flex: 1 1 auto;
		min-height: 0;
	}

	.plot {
		position: relative;
		width: 100%;
	}

	.line-chart--fill .plot {
		flex: 1 1 auto;
		min-height: 60px;
	}

	.chart-svg {
		position: absolute;
		inset: 0;
		display: block;
		overflow: visible;
	}

	.gridline {
		stroke: var(--brandGray);
		stroke-width: 0.5;
	}

	.axis-line {
		stroke: var(--brandGray);
		stroke-width: 0.75;
	}

	.axis-tick {
		font-family: Montserrat, sans-serif;
		font-size: 9px;
		fill: #000;
	}

	.axis-caption {
		font-size: 11px;
		font-family: Montserrat, sans-serif;
		color: #000;
		margin: 0;
		line-height: 1.3;
	}

	.chart-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 2px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 0.68rem;
		color: #000;
	}

	.legend-swatch {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		flex-shrink: 0;
	}
</style>