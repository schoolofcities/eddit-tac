<script>
	import "../../assets/global-styles.css";

	import Password from "$lib/Password.svelte";
	import TacMap from "$lib/maps/TacMap.svelte";
	import TacPanel from "$lib/maps/TacPanel.svelte";
	import { makeInitialLayerState } from "$lib/maps/tacLayerConfig.js";
	import venuesCentroids from "$data/venues-centroids.geo.json";

	// Matches the CSS breakpoint below. On mobile one stacked panel holds
	// everything; on desktop it splits into a layers column and a venue strip.
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
			id: String(f.properties.fid),
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
		.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
</script>

<svelte:head>
	<title>Arts Venue Map | Toronto Arts Council</title>
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
		<div class="tac-panel-wrap tac-side-wrap">
			<TacPanel section="all" bind:selectedVenueId bind:layerState bind:venueDisplayMode {venues} />
		</div>
	{:else}
		<div class="tac-panel-wrap tac-side-wrap">
			<TacPanel section="layers" bind:selectedVenueId bind:layerState bind:venueDisplayMode {venues} />
		</div>
		<div class="tac-panel-wrap tac-venue-wrap">
			<TacPanel section="venue" bind:selectedVenueId bind:layerState bind:venueDisplayMode {venues} />
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
	/*
		Desktop:
		┌──────────┬──────────────────────┐
		│  title + │                      │
		│  layers  │         map          │
		├──────────┴──────────────────────┤
		│  venue selector │ venue profile │
		└─────────────────────────────────┘
	*/

	.tac-layout {
		--tac-side-width: 400px;
		--tac-bottom-height: 300px; /* fixed: no longer scales with the window */

		display: grid;
		grid-template-columns: var(--tac-side-width) minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr) var(--tac-bottom-height);
		grid-template-areas:
			"side  map"
			"venue venue";
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