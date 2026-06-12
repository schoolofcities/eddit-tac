<script>
	import { LAYER_GROUPS } from '$lib/maps/tacLayerConfig.js';

	let {
		selectedVenueId = $bindable(null),
		layerState = $bindable({}),
		venues = [],
	} = $props();

	const selectedVenue = $derived(venues.find((v) => v.id === selectedVenueId) ?? null);

	function setExclusive(groupId, itemId) {
		const current = layerState[groupId]?.activeId ?? null;
		layerState[groupId].activeId = current === itemId ? null : itemId;
	}

	function setExclusiveFromSelect(groupId, value) {
		layerState[groupId].activeId = value || null;
	}

	function toggleNonExclusive(groupId, itemId) {
		if (itemId === 'commute-time' && !selectedVenueId) return;
		layerState[groupId][itemId] = !layerState[groupId][itemId];
	}

	function isOn(group, item) {
		if (group.exclusive) {
			return layerState[group.id]?.activeId === item.id;
		}
		return layerState[group.id]?.[item.id] ?? false;
	}
</script>

<aside class="panel">

	<!-- ── Header ─────────────────────────────────────────────────────── -->
	<header class="panel-header">
		<span class="header-org">School of Cities | Toronto Arts Council</span>
		<h1 class="header-title">Equitable Development Data Insight Training (EDDIT)</h1>
		<p class="header-authors">
			Author One, Author Two &middot; 2026
		</p>
	</header>

	<!-- ── Venue Selector ────────────────────────────────────────────── -->
	<section class="panel-section">
		<h2 class="section-heading">Arts Venue</h2>
		<p class="section-desc">
			Choose from the list or click a marker on the map.
		</p>

		<div class="select-wrapper">
			<select
				class="venue-select"
				value={selectedVenueId ?? ''}
				onchange={(e) => { selectedVenueId = e.currentTarget.value || null; }}
				aria-label="Select a venue"
			>
				<option value="">— Select a venue —</option>
				{#each venues as venue (venue.id)}
					<option value={venue.id}>{venue.name}</option>
				{/each}
				{#if venues.length === 0}
					<option value="" disabled>(Venues not yet loaded)</option>
				{/if}
			</select>
			<!-- Custom dropdown arrow -->
			<svg class="select-arrow" viewBox="0 0 10 6" aria-hidden="true">
				<path d="M0 0l5 6 5-6z" />
			</svg>
		</div>
	</section>

	<div class="divider"></div>
	<!-- ── Venue Description ──────────────────────────────────────────── -->
	<section class="panel-section">
		<h2 class="section-heading">Venue Description</h2>

		{#if selectedVenue}
			<p class="vd-name">{selectedVenue.name}</p>
			<p class="vd-address">{selectedVenue.address}, Toronto, ON {selectedVenue.postalCode}</p>
			<p class="vd-body">
				Venue description coming soon. This section will include a brief overview of the
				organization, its mandate, programming history, and community impact.
			</p>
		{:else}
			<p class="empty-state">Select a venue above or click a marker on the map to view its description.</p>
		{/if}
	</section>

	<div class="divider"></div>
	<!-- ── Layer Toggles ─────────────────────────────────────────────── -->
<section class="panel-section">
	<h2 class="section-heading">Map Layers</h2>

	{#each LAYER_GROUPS as group (group.id)}
		<div class="layer-group">
			<span class="layer-group-label">{group.label}</span>

			{#if group.ui === 'dropdown'}
				<div class="select-wrapper">
					<select
						class="venue-select layer-select"
						value={layerState[group.id]?.activeId ?? ''}
						onchange={(e) => setExclusiveFromSelect(group.id, e.currentTarget.value)}
						aria-label={`Select ${group.label} layer`}
					>
						<option value="">None</option>
						{#each group.items as item (item.id)}
							<option value={item.id}>{item.label}</option>
						{/each}
					</select>

					<svg class="select-arrow" viewBox="0 0 10 6" aria-hidden="true">
						<path d="M0 0l5 6 5-6z" />
					</svg>
				</div>

				{#if group.id === 'demography' && layerState.demography?.activeId}
					{@const selectedItem = group.items.find(
						item => item.id === layerState.demography.activeId
					)}

					{#if selectedItem}
						<svg class="legend" width="100%" height="40">
							{#each selectedItem.colors as color, i}
									<rect
										x={i * 20 + '%'}
										y="0"
										width="20%"
										height="20"
										fill={color}
										stroke="white"
										stroke-width="1"
										opacity="0.7"
									/>
							{/each}

							{#each selectedItem.breaks as value, i}
								<text
									class="legend-label"
									x={`${(i + 1) * 20}%`}
									y="35"
									text-anchor="middle"
								>
									{#if i === 0}
										&lt;{value.toLocaleString()}
									{:else if i === selectedItem.breaks.length - 1}
										&gt;{value.toLocaleString()}
									{:else}
										{value.toLocaleString()}
									{/if}
								</text>
							{/each}
						</svg>
					{/if}
				{/if}

			{:else if group.ui === 'radio-toggles'}
				<div class="activity-grid">
					{#each group.items as item (item.id)}
						<button
							type="button"
							class="activity-btn"
							class:active={isOn(group, item)}
							onclick={() => setExclusive(group.id, item.id)}
						>
							{item.label}
						</button>
					{/each}
				</div>

			{:else}
				{#each group.items as item (item.id)}
					<label
						class="layer-toggle"
						class:layer-toggle-disabled={item.id === 'commute-time' && !selectedVenueId}
					>
						<span class="toggle-track" class:on={isOn(group, item)}>
							<input
								type="checkbox"
								checked={isOn(group, item)}
								onchange={() => toggleNonExclusive(group.id, item.id)}
								class="sr-only"
								disabled={item.id === 'commute-time' && !selectedVenueId}
							/>
							<span class="toggle-thumb"></span>
						</span>
						<span class="layer-label">{item.label}</span>
					</label>
				{/each}
			{/if}
		</div>
	{/each}
</section>

	<div class="divider"></div>

	<!-- ── Venue Profile ─────────────────────────────────────────────── -->
	<section class="panel-section">
		<h2 class="section-heading">Venue Profile</h2>

		{#if selectedVenue}
			<p class="venue-name">{selectedVenue.name}</p>

			<!-- Stat cards placeholder — replace with real data -->
			<div class="stat-grid">
				<div class="stat-card">
					<span class="stat-label">Monthly Visitors</span>
					<span class="stat-value placeholder">—</span>
				</div>
				<div class="stat-card">
					<span class="stat-label">Catchment Radius</span>
					<span class="stat-value placeholder">—</span>
				</div>
				<div class="stat-card">
					<span class="stat-label">Equity Index</span>
					<span class="stat-value placeholder">—</span>
				</div>
				<div class="stat-card">
					<span class="stat-label">Transit Access</span>
					<span class="stat-value placeholder">—</span>
				</div>
			</div>
		{:else}
			<p class="empty-state">Select a venue above or click on the map to view its activity and demographic profile.</p>
		{/if}
	</section>

	<div class="divider"></div>

	<!-- ── Compare ───────────────────────────────────────────────────── -->
	<section class="panel-section panel-section--grow">
		<h2 class="section-heading">Compare Venues</h2>
		<p class="empty-state">
			Side-by-side comparison of multiple selected venues will appear here.
		</p>
	</section>

</aside>

<style>
	/* ── Container ──────────────────────────────────────────────────────── */

	.panel {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		background: #ffffff;
		color: var(--brandBlack);
		font-family: OpenSans, sans-serif;
		font-size: 0.8rem;
		overflow-y: auto;
		overflow-x: hidden;
		scrollbar-width: thin;
		scrollbar-color: var(--brandGray) transparent;
	}

	/* ── Header ─────────────────────────────────────────────────────────── */

	.panel-header {
		flex-shrink: 0;
		padding: 16px 16px 14px;
		background: var(--brandDarkBlue);
		color: #fff;
	}

	.header-org {
		display: block;
		font-family: TradeGothic, sans-serif;
		font-size: 0.65rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--brandLightBlue);
		margin-bottom: 6px;
	}

	.header-title {
		font-family: TradeGothicBold, sans-serif;
		font-size: 1.05rem;
		line-height: 1.25;
		margin: 0 0 10px;
		color: #fff;
	}

	.header-authors {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.6);
		margin: 0;
		line-height: 1.4;
	}

	/* ── Sections ───────────────────────────────────────────────────────── */

	.divider {
		height: 1px;
		background: var(--brandGray);
		flex-shrink: 0;
	}

	.panel-section {
		padding: 14px 16px;
		flex-shrink: 0;
	}

	/* Let the last section expand to fill remaining height */
	.panel-section--grow {
		flex: 1;
	}

	.section-heading {
		font-family: TradeGothicBold, sans-serif;
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--brandDarkBlue);
		margin: 0 0 8px;
	}

	.section-desc {
		font-size: 0.73rem;
		color: var(--brandGray60);
		margin: 0 0 10px;
		line-height: 1.45;
	}

	.empty-state {
		font-size: 0.73rem;
		color: var(--brandGray60);
		line-height: 1.5;
		font-style: italic;
		margin: 0;
	}

	/* ── Venue Select ───────────────────────────────────────────────────── */

	.select-wrapper {
		position: relative;
	}

	.layer-select {
		font-size: 0.75rem;
	}

	.venue-select {
		width: 100%;
		padding: 7px 28px 7px 10px;
		font-family: OpenSans, sans-serif;
		font-size: 0.78rem;
		border: 1px solid var(--brandGray);
		border-radius: 4px;
		background: #fff;
		color: var(--brandBlack);
		appearance: none;
		-webkit-appearance: none;
		cursor: pointer;
		outline: none;
		transition: border-color 0.15s, box-shadow 0.15s;
		box-sizing: border-box;
	}

	.venue-select:focus {
		border-color: var(--brandMedBlue);
		box-shadow: 0 0 0 2px rgba(0, 127, 163, 0.18);
	}

	.select-arrow {
		position: absolute;
		right: 10px;
		top: 50%;
		transform: translateY(-50%);
		width: 10px;
		height: 6px;
		fill: var(--brandDarkBlue);
		pointer-events: none;
	}

	/* ── Layer Toggles ──────────────────────────────────────────────────── */

	.layer-group {
		margin-bottom: 10px;
	}

	.layer-group:last-child {
		margin-bottom: 0;
	}

	.layer-group-label {
		display: block;
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--brandGray60);
		margin-bottom: 5px;
	}

	.layer-toggle {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 4px 0;
		cursor: pointer;
		user-select: none;
	}

	.layer-toggle-disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Screen-reader only — visually hidden checkbox */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	/* Toggle pill */
	.toggle-track {
		position: relative;
		display: inline-flex;
		align-items: center;
		width: 30px;
		height: 16px;
		border-radius: 8px;
		background: var(--brandGray);
		flex-shrink: 0;
		transition: background 0.2s;
		cursor: pointer;
	}

	.toggle-track.on {
		background: var(--brandMedBlue);
	}

	.toggle-thumb {
		position: absolute;
		left: 2px;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #fff;
		transition: left 0.2s;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.toggle-track.on .toggle-thumb {
		left: 16px;
	}

	.layer-label {
		font-size: 0.77rem;
		color: var(--brandBlack);
		line-height: 1.3;
	}

	.activity-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.activity-btn {
		border: 1px solid var(--brandGray);
		background: #fff;
		color: var(--brandGray70);
		padding: 5px 8px;
		font-size: 0.7rem;
		font-family: OpenSans, sans-serif;
		border-radius: 999px;
		line-height: 1.2;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.activity-btn.active {
		background: var(--brandMedBlue);
		border-color: var(--brandMedBlue);
		color: #fff;
	}

	/* ── Venue Description ──────────────────────────────────────────────── */

	.vd-name {
		font-family: TradeGothicBold, sans-serif;
		font-size: 0.92rem;
		color: var(--brandDarkBlue);
		margin: 0 0 4px;
		line-height: 1.25;
	}

	.vd-address {
		font-size: 0.72rem;
		color: var(--brandGray60);
		margin: 0 0 10px;
		line-height: 1.4;
	}

	.vd-body {
		font-size: 0.75rem;
		color: var(--brandBlack);
		line-height: 1.55;
		margin: 0;
		font-style: italic;
		opacity: 0.65;
	}

	/* ── Venue Profile ──────────────────────────────────────────────────── */

	.venue-name {
		font-family: TradeGothicBold, sans-serif;
		font-size: 0.88rem;
		color: var(--brandDarkBlue);
		margin: 0 0 10px;
	}

	.stat-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.stat-card {
		background: #f4f5f7;
		border-radius: 4px;
		padding: 10px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.stat-label {
		font-size: 0.65rem;
		color: var(--brandGray60);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		line-height: 1.3;
	}

	.stat-value {
		font-family: TradeGothicBold, sans-serif;
		font-size: 1rem;
		color: var(--brandDarkBlue);
	}

	.stat-value.placeholder {
		color: var(--brandGray);
	}

	.legend {
	margin-top: 0.5rem;
	display: block;
	}
</style>
