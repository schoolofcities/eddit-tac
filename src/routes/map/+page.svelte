<script>
	import '../../assets/global-styles.css';

	import TacMap   from '$lib/maps/TacMap.svelte';
	import TacPanel from '$lib/maps/TacPanel.svelte';
	import { makeInitialLayerState } from '$lib/maps/tacLayerConfig.js';

	let map = $state(null);
	let selectedVenueId = $state(null);
	let layerState = $state(makeInitialLayerState());
	const venues = [];
</script>

<svelte:head>
	<title>Arts Venue Map | Toronto Arts Council</title>
	<meta name="description" content="Equitable development initiative: exploring activity, demography, and access across Toronto Arts Council venues." />
	<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
</svelte:head>

<div class="tac-layout">

	<div class="tac-panel-wrap">
		<TacPanel
			bind:selectedVenueId
			bind:layerState
			{venues}
		/>
	</div>

	<div class="tac-map-wrap">
		<TacMap
			bind:map
			bind:selectedVenueId
			{layerState}
		/>
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
		display: flex;
		flex-direction: row;
		width:  100vw;
		height: 100dvh;
		overflow: hidden;
	}

	.tac-panel-wrap {
		width: 400px;
		height: 100%;
		flex-shrink: 0;
		border-right: 1px solid var(--brandGray);
		overflow: hidden;
		z-index: 10;
	}

	/* Map: fills remaining space */
	.tac-map-wrap {
		flex: 1;
		height: 100%;
		position: relative;
		min-width: 0; /* prevent flex blowout */
	}

	/* ── Mobile: stack vertically ────────────────────────────────────────── */
	/*
		Map takes the top 55%, panel the bottom 45%.
		Flip the visual order so the map is always at top of screen.
	*/
	@media (max-width: 768px) {
		.tac-layout {
			flex-direction: column;
		}

		.tac-panel-wrap {
			width:  100vw;
			height: 45dvh;
			border-right: none;
			border-top: 1px solid var(--brandGray);
			order: 2;
		}

		.tac-map-wrap {
			width:  100vw;
			height: 55dvh;
			order: 1;
		}
	}
</style>
