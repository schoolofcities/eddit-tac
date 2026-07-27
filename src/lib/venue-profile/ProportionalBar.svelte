<script>
	/**
	 * Horizontal proportional/stacked bar used for the 2-, 3- and 4-segment
	 * venue-profile metrics (weekday/weekend, daytime/evening, home-origin
	 * concentration, travel distance). Segment values are treated as shares of
	 * `total` (defaults to summing the segments themselves, i.e. percentages
	 * that already sum to ~100).
	 */
	let {
		segments = [], // [{ label, value, color }]
		total = null,
		referenceLine = null, // position, 0-100, for a dotted reference marker
		referenceLabel = "",
		showLegend = true,
		height = 22,
	} = $props();

	const safeTotal = $derived(
		total ?? segments.reduce((sum, s) => sum + s.value, 0) ?? 100,
	);

	function widthPct(value) {
		return (value / (safeTotal || 1)) * 100;
	}
</script>

<div class="prop-bar-wrap">
	<div class="prop-bar" style={`height:${height}px`}>
		{#each segments as seg, i (seg.label + i)}
			{#if seg.value > 0}
				<div
					class="prop-bar-segment"
					style={`width:${widthPct(seg.value)}%; background:${seg.color}`}
					title={`${seg.label || "Segment"}: ${seg.value.toFixed(1)}%`}
				></div>
			{/if}
		{/each}

		{#if referenceLine !== null}
			<div class="reference-line" style={`left:${referenceLine}%`}>
				{#if referenceLabel}
					<span class="reference-label">{referenceLabel}</span>
				{/if}
			</div>
		{/if}
	</div>

	{#if showLegend}
		<div class="prop-bar-legend">
			{#each segments as seg, i (seg.label + i)}
				{#if seg.label}
					<span class="legend-item">
						<span
							class="legend-swatch"
							style={`background:${seg.color}`}
						></span>
						{seg.label}
						<span class="legend-value"
							>{seg.value.toFixed(1)}%</span
						>
					</span>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.prop-bar-wrap {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.prop-bar {
		position: relative;
		display: flex;
		width: 100%;
		background: var(--brandGray);
		box-sizing: border-box;
	}

	.prop-bar-segment {
		height: 100%;
		box-sizing: border-box;
		border-right: 2px solid rgb(246, 246, 246);
	}

	.prop-bar-segment:last-child {
		border-right: none;
	}

	.reference-line {
		position: absolute;
		top: -5px;
		bottom: -5px;
		width: 0;
		border-left: 1.5px dashed var(--brandGray80);
	}

	.reference-label {
		position: absolute;
		top: -13px;
		left: 3px;
		font-size: 0.6rem;
		color: var(--brandGray70);
		white-space: nowrap;
	}

	.prop-bar-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
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

	.legend-value {
		font-weight: bold;
		color: var(--brandBlack);
	}
</style>
