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
		height = 120,
	} = $props();

	const width = 300;
	const padding = { top: 8, right: 6, bottom: 20, left: 30 };

	const plotWidth = $derived(width - padding.left - padding.right);
	const plotHeight = $derived(height - padding.top - padding.bottom);

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

	const yTicks = $derived([0, yMax / 2, yMax]);

	const xTickIndices = $derived.by(() => {
		if (n === 0) return [];
		const idx = new Set([0, n - 1]);
		for (let i = 0; i < n; i += xTickEvery) idx.add(i);
		return [...idx].sort((a, b) => a - b);
	});
</script>

<div class="line-chart">
	<svg
		viewBox={`0 0 ${width} ${height}`}
		preserveAspectRatio="none"
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
				y={yPos(tick) + 2.5}
				class="axis-tick"
				text-anchor="end">{yFormat(tick)}</text
			>
		{/each}

		<!-- x-axis baseline -->
		<line
			x1={padding.left}
			x2={width - padding.right}
			y1={height - padding.bottom}
			y2={height - padding.bottom}
			class="axis-line"
		/>

		<!-- x ticks -->
		{#each xTickIndices as i (i)}
			<text
				x={xPos(i)}
				y={height - padding.bottom + 11}
				class="axis-tick"
				text-anchor="middle">{xLabels[i]}</text
			>
		{/each}

		<!-- series -->
		{#each series as s (s.id)}
			<path
				d={linePath(s.points)}
				stroke={s.color}
				stroke-width="1.6"
				stroke-linecap="round"
				stroke-linejoin="round"
				fill="none"
			/>
			{#each s.points as p, i (i)}
				<circle cx={xPos(i)} cy={yPos(p.y)} r="1.7" fill={s.color}>
					<title>{xLabels[i]}: {yFormat(p.y)}</title>
				</circle>
			{/each}
		{/each}
	</svg>

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

	.chart-svg {
		width: 100%;
		height: 120px;
		display: block;
		overflow: visible;
	}

	.gridline {
		stroke: var(--brandGray);
		stroke-width: 0.4;
	}

	.axis-line {
		stroke: var(--brandGray);
		stroke-width: 0.6;
	}

	.axis-tick {
		font-family: Montserrat, sans-serif;
		font-size: 6.2px;
		fill: var(--brandGray60);
	}

	.axis-caption {
		font-size: 0.62rem;
		color: var(--brandGray60);
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
		color: var(--brandGray70);
	}

	.legend-swatch {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		flex-shrink: 0;
	}
</style>
