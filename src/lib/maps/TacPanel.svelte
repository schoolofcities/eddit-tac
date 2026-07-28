<script>
	import { LAYER_GROUPS } from "$lib/maps/tacLayerConfig.js";
	import VenueProfile from "$lib/venue-profile/VenueProfile.svelte";

	let {
		selectedVenueId = $bindable(null),
		layerState = $bindable({}),
		venues = [],
	} = $props();

	const selectedVenue = $derived(
		venues.find((v) => v.id === selectedVenueId) ?? null,
	);

	function setExclusive(groupId, itemId) {
		if (groupId === "activity" && !selectedVenueId) return;
		const current = layerState[groupId]?.activeId ?? null;
		const next = current === itemId ? null : itemId;
		layerState[groupId].activeId = next;
		applyCrossGroupExclusion(groupId, next);
	}

	function setExclusiveFromSelect(groupId, value) {
		const next = value || null;
		layerState[groupId].activeId = next;
		applyCrossGroupExclusion(groupId, next);
	}

	// Demography, Activity, and Commute Time are three fill layers drawn on
	// the same map surface — picking one clears the other two so they never
	// compete for the same visual space. "except" is the layer that was just
	// activated and should be left alone.
	function clearOtherExclusiveLayers(except) {
		if (except !== "demography") layerState.demography.activeId = null;
		if (except !== "activity") layerState.activity.activeId = null;
		if (except !== "commute-time") layerState.mobility["commute-time"] = null;
	}

	function applyCrossGroupExclusion(groupId, next) {
		if (!next) return;
		if (groupId !== "demography" && groupId !== "activity") return;
		clearOtherExclusiveLayers(groupId);
	}

	function toggleNonExclusive(groupId, itemId) {
		if (itemId === "commute-time" && !selectedVenueId) return;
		layerState[groupId][itemId] = !layerState[groupId][itemId];
	}

	function setCommutePeriod(groupId, itemId, optionId) {
		if (!selectedVenueId) return;
		const current = layerState[groupId]?.[itemId] ?? null;
		const next = current === optionId ? null : optionId;
		layerState[groupId][itemId] = next;
		if (next) clearOtherExclusiveLayers("commute-time");
	}

	function isOn(group, item) {
		if (group.exclusive) {
			return layerState[group.id]?.activeId === item.id;
		}
		return layerState[group.id]?.[item.id] ?? false;
	}
</script>

{#snippet breaksLegend(item)}
	<svg class="legend" width="100%" height="40">
		{#each item.colors as color, i}
			<rect
				x={i * 20 + "%"}
				y="0"
				width="20%"
				height="20"
				fill={color}
				stroke="white"
				stroke-width="1"
				opacity="0.4"
			/>
		{/each}

		{#each item.breaks as value, i}
			<text
				class="legend-label"
				x={`${(i + 1) * 20}%`}
				y="35"
				text-anchor="middle"
			>
				{#if i === 0}
					&lt;{value.toLocaleString()}
				{:else if i === item.breaks.length - 1}
					&gt;{value.toLocaleString()}
				{:else}
					{value.toLocaleString()}
				{/if}
			</text>
		{/each}
	</svg>
{/snippet}

<aside class="panel">
	<!-- ── Header ─────────────────────────────────────────────────────── -->
	<header class="panel-header">
		<h1 class="header-title">ACCESS IN THE ARTS</h1>
		<span class="header-org">School of Cities | Toronto Arts Council</span>

		<p class="header-authors">Author One, Author Two &middot; 2026</p>
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
				value={selectedVenueId ?? ""}
				onchange={(e) => {
					selectedVenueId = e.currentTarget.value || null;
				}}
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
		<!-- <h2 class="section-heading">Venue Description</h2> -->

		{#if selectedVenue}
			<p class="vd-name">{selectedVenue.name}</p>
			<p class="vd-type">{selectedVenue.type}</p>
			<p class="vd-address">
				{selectedVenue.address}, Toronto, ON {selectedVenue.postalCode}
			</p>
			<p class="vd-body">
				{selectedVenue.description || "Venue description coming soon."}
			</p>
		{:else}
			<p class="empty-state">
				Select a venue above or click a marker on the map to view its
				description.
			</p>
		{/if}
	</section>

	<div class="divider"></div>
	<!-- ── Layer Toggles ─────────────────────────────────────────────── -->
	<section class="panel-section">
		<h2 class="section-heading">Map Layers</h2>

		{#each LAYER_GROUPS as group (group.id)}
			<div class="layer-group">
				<span class="layer-group-label">{group.label}</span>

				{#if group.ui === "dropdown"}
					<div class="select-wrapper">
						<select
							class="venue-select layer-select"
							value={layerState[group.id]?.activeId ?? ""}
							onchange={(e) =>
								setExclusiveFromSelect(
									group.id,
									e.currentTarget.value,
								)}
							aria-label={`Select ${group.label} layer`}
						>
							<option value="">None</option>
							{#each group.items as item (item.id)}
								<option value={item.id}>{item.label}</option>
							{/each}
						</select>

						<svg
							class="select-arrow"
							viewBox="0 0 10 6"
							aria-hidden="true"
						>
							<path d="M0 0l5 6 5-6z" />
						</svg>
					</div>

					{#if group.id === "demography" && layerState.demography?.activeId}
						{@const selectedItem = group.items.find(
							(item) =>
								item.id === layerState.demography.activeId,
						)}

						{#if selectedItem}
							{@render breaksLegend(selectedItem)}
						{/if}
					{/if}
				{:else if group.ui === "radio-toggles"}
					<div class="activity-grid">
						{#each group.items as item (item.id)}
							<button
								type="button"
								class="activity-btn"
								class:active={isOn(group, item)}
								disabled={group.id === "activity" &&
									!selectedVenueId}
								onclick={() => setExclusive(group.id, item.id)}
							>
								{item.label}
							</button>
						{/each}
					</div>

					{#if group.id === "activity"}
						{#if !selectedVenueId}
							<p class="section-desc activity-hint">
								Select a venue to view its home-origin
								activity layers.
							</p>
						{:else if layerState.activity?.activeId}
							{@const selectedActivityItem = group.items.find(
								(item) =>
									item.id === layerState.activity.activeId,
							)}
							{#if selectedActivityItem}
								{@render breaksLegend(selectedActivityItem)}
								<p class="section-desc legend-caption">
									% share of the venue's estimated
									home-origin visitors, by census ADA
									(quintiles). Gray ADAs had no estimated
									visitors.
								</p>
							{/if}
						{/if}
					{/if}
				{:else}
					{#each group.items as item (item.id)}
						{#if item.options}
							<div
								class="commute-period-row"
								class:layer-toggle-disabled={!selectedVenueId}
							>
								<span class="layer-label"
									>{item.label}</span
								>
								<div class="commute-period-buttons">
									{#each item.options as option (option.id)}
										<button
											type="button"
											class="period-btn"
											class:active={layerState[
												group.id
											]?.[item.id] === option.id}
											disabled={!selectedVenueId}
											onclick={() =>
												setCommutePeriod(
													group.id,
													item.id,
													option.id,
												)}
										>
											{option.label}
										</button>
									{/each}
								</div>
							</div>
						{:else}
							<label class="layer-toggle">
								<span
									class="toggle-track"
									class:on={isOn(group, item)}
								>
									<input
										type="checkbox"
										checked={isOn(group, item)}
										onchange={() =>
											toggleNonExclusive(
												group.id,
												item.id,
											)}
										class="sr-only"
									/>
									<span class="toggle-thumb"></span>
								</span>
								<span class="layer-label">{item.label}</span>
							</label>
						{/if}
					{/each}

					{#if group.items.some((item) => item.id === "commute-time") && layerState[group.id]?.["commute-time"]}
						{@const commuteItem = group.items.find(
							(item) => item.id === "commute-time",
						)}
						{@const commuteBuckets = commuteItem.cutoffs.map(
							(cutoff, i) => ({
								label: `${cutoff} min`,
								color: commuteItem.colors[i],
							}),
						)}
						<svg class="legend" width="100%" height="40">
							{#each commuteBuckets as bucket, i}
								<rect
									x={(i * 100) / commuteBuckets.length + "%"}
									y="0"
									width={100 / commuteBuckets.length + "%"}
									height="20"
									fill={bucket.color}
									stroke="white"
									stroke-width="1"
									opacity="0.7"
								/>
							{/each}
							{#each commuteBuckets as bucket, i}
								<text
									class="legend-label"
									x={`${(i + 0.5) * (100 / commuteBuckets.length)}%`}
									y="35"
									text-anchor="middle"
								>
									{bucket.label}
								</text>
							{/each}
						</svg>
					{/if}
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

			<VenueProfile venueId={selectedVenue.id} />
		{:else}
			<p class="empty-state">
				Select a venue above or click on the map to view its activity
				and demographic profile.
			</p>
		{/if}
	</section>

	<div class="divider"></div>

	<!-- ── Compare ───────────────────────────────────────────────────── -->
	<section class="panel-section panel-section--grow">
		<h2 class="section-heading">Compare Venues</h2>
		<p class="empty-state">
			Side-by-side comparison of multiple selected venues will appear
			here.
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
		background: rgb(246, 246, 246);
		color: var(--brandBlack);
		font-family: Montserrat, sans-serif;
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
		background: rgb(246, 246, 246);
		color: #000;
	}

	.header-org {
		display: block;
		font-family: Montserrat, sans-serif;
		font-weight: bold;
		font-size: 0.65rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgb(0, 98, 234);
		margin-bottom: 6px;
	}

	.header-title {
		font-family: Montserrat, sans-serif;
		font-weight: 600;
		font-size: 1.05rem;
		line-height: 1.25;
		margin: 0 0 10px;
		color: #000;
	}

	.header-authors {
		font-size: 0.7rem;
		color: rgba(0, 0, 0, 0.6);
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
		font-family: Montserrat, sans-serif;
		font-weight: bold;
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: rgb(0, 98, 234);
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
		font-family: Montserrat, sans-serif;
		font-size: 0.78rem;
		border: 1px solid var(--brandGray);
		border-radius: 0px;
		background: #fff;
		color: var(--brandBlack);
		appearance: none;
		-webkit-appearance: none;
		cursor: pointer;
		outline: none;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
		box-sizing: border-box;
	}

	.venue-select:focus {
		border-color: rgb(0, 98, 234);
		box-shadow: 0 0 0 2px rgba(0, 127, 163, 0.18);
	}

	.select-arrow {
		position: absolute;
		right: 10px;
		top: 50%;
		transform: translateY(-50%);
		width: 10px;
		height: 6px;
		fill: rgb(0, 98, 234);
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
		background: rgb(0, 98, 234);
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

	.commute-period-row {
		display: flex;
		flex-direction: column;
		gap: 5px;
		padding: 4px 0;
	}

	.commute-period-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.period-btn {
		border: 1px solid var(--brandGray);
		background: #fff;
		color: var(--brandGray70);
		padding: 5px 10px;
		font-size: 0.7rem;
		font-family: Montserrat, sans-serif;
		border-radius: 0px;
		line-height: 1.2;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.period-btn.active {
		background: rgb(0, 98, 234);
		border-color: rgb(0, 98, 234);
		color: #fff;
	}

	.period-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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
		font-family: Montserrat, sans-serif;
		border-radius: 0px;
		line-height: 1.2;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.activity-btn.active {
		background: rgb(0, 98, 234);
		border-color: rgb(0, 98, 234);
		color: #fff;
	}

	.activity-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.activity-hint {
		margin: 6px 0 0;
	}

	.legend-caption {
		margin: 4px 0 0;
	}

	/* ── Venue Description ──────────────────────────────────────────────── */

	.vd-name {
		font-family: Montserrat, sans-serif;
		font-weight: bold;
		font-size: 0.92rem;
		color: rgb(0, 98, 234);
		margin: 0 0 4px;
		line-height: 1.25;
	}

	.vd-type {
		font-size: 0.72rem;
		color: var(--brandGray60);
		margin: 0 0 6px;
		line-height: 1.4;
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
		opacity: 0.65;
	}

	/* ── Venue Profile ──────────────────────────────────────────────────── */

	.venue-name {
		font-family: Montserrat, sans-serif;
		font-weight: bold;
		font-size: 0.88rem;
		color: rgb(0, 98, 234);
		margin: 0 0 10px;
	}

	.legend {
		margin-top: 0.5rem;
		display: block;
	}

	.legend-label {
		font-size: 0.6rem;
		fill: var(--brandGray60);
		font-family: Montserrat, sans-serif;
	}
</style>