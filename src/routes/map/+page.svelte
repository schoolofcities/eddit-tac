<script>
	import "../../assets/global-styles.css";

	import Password from "$lib/Password.svelte";
	import TacMap from "$lib/maps/TacMap.svelte";
	import TacPanel from "$lib/maps/TacPanel.svelte";
	import TacProfilePanel from "$lib/maps/TacProfilePanel.svelte";
	import { makeInitialLayerState } from "$lib/maps/tacLayerConfig.js";
	import venuesCentroids from "$data/venues/venues-centroids.geo.json";

	// Matches the CSS breakpoint below. On mobile one stacked panel holds
	// everything; on desktop it splits into a left column (title, arts venue,
	// map layers) and a venue profile strip along the bottom.
	let isMobile = $state(false);

	$effect(() => {
		const mq = window.matchMedia("(max-width: 768px)");
		isMobile = mq.matches;
		const update = (e) => (isMobile = e.matches);
		mq.addEventListener("change", update);
		return () => mq.removeEventListener("change", update);
	});

	let map = $state(null);
	let selectedVenueId = $state(null);
	let layerState = $state(makeInitialLayerState());
	let venueDisplayMode = $state("some"); // "some" (default) | "all"

	// Derive a simple list for the panel dropdown — sorted alphabetically
	const venues = venuesCentroids.features
		.map((f) => ({
			// Same rule TacMap uses (venueKey), so the dropdown and map clicks
			// produce identical ids.
			id: String(f.properties.id ?? f.properties.fid),
			name: f.properties.venue_name,
			type: f.properties.primary_discipline
				? f.properties.primary_discipline
						.replace(/_/g, " ")
						.replace(/\b\w/g, (c) => c.toUpperCase())
				: null,
			address: f.properties.address,
			postalCode: f.properties.postal_code,
			description: f.properties.venue_description,
		}))
		// Keep one entry per id. The dropdown's list is keyed by id, and a
		// repeated id makes Svelte throw (each_key_duplicate), which silently
		// stops the map and profile from reacting to the selection.
		.filter((v, i, all) => {
			const first = all.findIndex((o) => o.id === v.id) === i;
			if (!first) {
				console.warn(
					`[venues] duplicate venue id "${v.id}" in venues-centroids — keeping the first ("${all.find((o) => o.id === v.id).name}"), skipping "${v.name}"`,
				);
			}
			return first;
		})
		.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
</script>

<svelte:head>
	<title>Access to the Arts | Toronto Arts Council</title>
	<meta
		name="description"
		content="Equitable development initiative: exploring activity, demography, and access across Toronto Arts Council venues."
	/>
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1, minimum-scale=1"
	/>
</svelte:head>

<Password />

<div class="tac-layout">
	{#if isMobile}
		<!-- Mobile: one panel with everything, Venue Profile included -->
		<div class="tac-panel-wrap tac-side-wrap">
			<TacPanel bind:selectedVenueId bind:layerState bind:venueDisplayMode {venues} />
		</div>
	{:else}
		<!-- Desktop: left column without the profile... -->
		<div class="tac-panel-wrap tac-side-wrap">
			<TacPanel
				showProfile={false}
				bind:selectedVenueId
				bind:layerState
				bind:venueDisplayMode
				{venues}
			/>
		</div>
		<!-- ...and the profile on its own in the strip under the map -->
		<div class="tac-panel-wrap tac-venue-wrap">
			<TacProfilePanel {selectedVenueId} {venueDisplayMode} {venues} />
		</div>
	{/if}

	<!-- Kept outside the {#if} so the map never remounts on resize -->
	<div class="tac-map-wrap">
		<TacMap bind:map bind:selectedVenueId {layerState} bind:venueDisplayMode />
	</div>
</div>

<style>
	/* Reset: prevent the global body styles from adding scroll or min-width */
	:global(html, body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
		width: 100%;
		height: 100%;
	}

	/* ── Layout ──────────────────────────────────────────────────────────── */

	.tac-layout {
		--tac-side-width: 400px;
		--tac-bottom-height: 300px; /* fixed: no longer scales with the window */

		display: grid;
		grid-template-columns: var(--tac-side-width) minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr) var(--tac-bottom-height);
		grid-template-areas:
			"side map"
			"side venue";
		width: 100vw;
		height: 100dvh;
		overflow: hidden;
	}

	.tac-panel-wrap {
		min-height: 0;
		overflow: hidden;
		z-index: 10;
	}

	/* Fixed-size cell: the layers panel scrolls inside it rather than growing */
	.tac-side-wrap {
		grid-area: side;
		border-right: 1px solid var(--brandGray);
	}

	.tac-venue-wrap {
		grid-area: venue;
		border-top: 1px solid var(--brandGray);
	}

	.tac-map-wrap {
		grid-area: map;
		position: relative;
		min-width: 0;
		min-height: 0;
	}

	/* ── Mobile: stack vertically ────────────────────────────────────────── */
	/* Map takes the top 55%, the single combined panel the bottom 45%. */
	@media (max-width: 768px) {
		.tac-layout {
			grid-template-columns: 100vw;
			grid-template-rows: 55dvh 45dvh;
			grid-template-areas:
				"map"
				"side";
		}

		.tac-side-wrap {
			border-right: none;
			border-top: 1px solid var(--brandGray);
		}
	}
</style>