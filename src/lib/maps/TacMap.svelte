<script>
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { LAYER_GROUPS } from './tacLayerConfig.js';
	import torontoBoundary from '$data/toronto-boundary.geo.json';

	let {
		map = $bindable(null),
		selectedVenueId = $bindable(null),
		layerState = {},
	} = $props();

	const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
    // Other easy swaps:
	// 'https://tiles.openfreemap.org/styles/bright'
	// 'https://tiles.openfreemap.org/styles/liberty'
	// 'https://api.protomaps.com/styles/v2/light.json?key=YOUR_KEY'
	// 'https://api.maptiler.com/maps/streets/style.json?key=YOUR_KEY'
	// 'https://tiles.stadiamaps.com/styles/alidade_smooth.json?api_key=YOUR_KEY'

	const MAP_CENTER = [-79.383, 43.718];
	const MAP_ZOOM = 11;
	const MAP_MIN_ZOOM = 8.5;
	const MAP_MAX_ZOOM = 16;
	const MAP_MAX_BOUNDS = [
		[-80.1, 43.35],
		[-78.8, 44.05],
	];

	let mapContainer;
	let mapLoaded = $state(false);

	const VENUES = [];

	onMount(() => {
		map = new maplibregl.Map({
			container: mapContainer,
			style: MAP_STYLE,
			center: MAP_CENTER,
			zoom: MAP_ZOOM,
			minZoom: MAP_MIN_ZOOM,
			maxZoom: MAP_MAX_ZOOM,
			maxBounds: MAP_MAX_BOUNDS,
			dragRotate: false,
			touchPitch: false,
			attributionControl: false,
		});

		map.addControl(
			new maplibregl.NavigationControl({ showCompass: false }),
			'top-right'
		);
		map.addControl(
			new maplibregl.ScaleControl({ unit: 'metric', maxWidth: 100 }),
			'bottom-right'
		);
		map.addControl(
			new maplibregl.AttributionControl({ compact: true }),
			'bottom-left'
		);

		map.on('load', () => {
			mapLoaded = true;
			addTorontoBoundary();
			addVenueMarkers();
			syncLayers();
		});

		const resizeObserver = new ResizeObserver(() => map?.resize());
		resizeObserver.observe(mapContainer);

		return () => {
			resizeObserver.disconnect();
			map?.remove();
		};
	});

	function addTorontoBoundary() {
		if (!map) return;

		map.addSource('toronto-boundary', {
			type: 'geojson',
			data: torontoBoundary,
		});

		// Dim everything outside Toronto with a semi-transparent white fill
		map.addLayer({
			id: 'toronto-mask',
			type: 'fill',
			source: 'toronto-boundary',
			filter: ['==', ['get', 'name'], 'outside-mask'],
			paint: {
				'fill-color': '#ffffff',
				'fill-opacity': 0.5,
			},
		});

		// Thick border around City of Toronto
		map.addLayer({
			id: 'toronto-border',
			type: 'line',
			source: 'toronto-boundary',
			filter: ['==', ['get', 'name'], 'Toronto'],
			paint: {
				'line-color': '#1E3765',
				'line-width': 2.5,
				'line-opacity': 0.85,
			},
		});
	}

	function addVenueMarkers() {
		if (!map || VENUES.length === 0) return;

		map.addSource('venues', {
			type: 'geojson',
			data: {
				type: 'FeatureCollection',
				features: VENUES.map((v) => ({
					type: 'Feature',
					geometry: { type: 'Point', coordinates: [v.lng, v.lat] },
					properties: { id: v.id, name: v.name },
				})),
			},
		});

		map.addLayer({
			id: 'venues-halo',
			type: 'circle',
			source: 'venues',
			paint: {
				'circle-radius': [
					'interpolate',
					['linear'],
					['zoom'],
					10,
					8,
					15,
					14,
				],
				'circle-color': '#ffffff',
				'circle-opacity': 0.9,
				'circle-stroke-width': 0,
			},
		});

		map.addLayer({
			id: 'venues-circle',
			type: 'circle',
			source: 'venues',
			paint: {
				'circle-radius': [
					'interpolate',
					['linear'],
					['zoom'],
					10,
					5,
					15,
					10,
				],
				'circle-color': [
					'case',
					['==', ['get', 'id'], selectedVenueId ?? ''],
					'#DC4633',
					'#1E3765',
				],
				'circle-stroke-width': 1.5,
				'circle-stroke-color': '#ffffff',
			},
		});

		map.on('click', 'venues-circle', (e) => {
			const feature = e.features?.[0];
			if (feature) selectedVenueId = feature.properties.id;
		});

		map.on('mouseenter', 'venues-circle', () => {
			map.getCanvas().style.cursor = 'pointer';
		});
		map.on('mouseleave', 'venues-circle', () => {
			map.getCanvas().style.cursor = '';
		});
	}

	function syncLayers() {
		if (!map || !mapLoaded) return;

		for (const group of LAYER_GROUPS) {
			for (const item of group.items) {
				const isVisible = group.exclusive
					? layerState[group.id]?.activeId === item.id
					: (layerState[group.id]?.[item.id] ?? false);

				if (!isVisible) continue;

				switch (item.id) {
					case 'pop-density':
					case 'age-0-14':
					case 'age-15-64':
					case 'age-65-plus':
					case 'median-age':
					case 'mean-age':
					case 'avg-household-size':
					case 'one-parent-families':
					case 'income':
					case 'pct-bachelors':
					case 'pct-diploma':
					case 'pct-highschool':
					case 'nocs-arts':
					case 'naics-arts':
					case 'shelter-costs':
					case 'core-housing-need':
					case 'citizenship':
					case 'visible-minority':
						// TODO: demography layer keyed by item.key
						break;

					case 'activity-all':
					case 'activity-evenings':
					case 'activity-daytime':
					case 'activity-weekdays':
					case 'activity-weekends':
						// TODO: activity map layer
						break;

					case 'transit-subway':
					case 'transit-streetcars':
					case 'transit-busses':
					case 'transit-go':
						// TODO: route overlays
						break;

					case 'commute-time':
						// TODO: requires selectedVenueId
						break;

					case 'ref-neighbourhoods':
					case 'ref-municipalities':
						// TODO: reference boundaries
						break;
				}
			}
		}
	}

	$effect(() => {
		if (!selectedVenueId || !mapLoaded) return;
		const venue = VENUES.find((v) => v.id === selectedVenueId);
		if (venue) {
			map?.flyTo({ center: [venue.lng, venue.lat], zoom: 14, duration: 800 });
		}
	});

	$effect(() => {
		if (!mapLoaded || !map?.getLayer('venues-circle')) return;
		const selected = selectedVenueId;
		map.setPaintProperty('venues-circle', 'circle-color', [
			'case',
			['==', ['get', 'id'], selected ?? ''],
			'#DC4633',
			'#1E3765',
		]);
	});

	$effect(() => {
		for (const group of LAYER_GROUPS) {
			if (group.exclusive) {
				void layerState[group.id]?.activeId;
			} else {
				for (const item of group.items) {
					void layerState[group.id]?.[item.id];
				}
			}
		}
		syncLayers();
	});
</script>

<div bind:this={mapContainer} class="map-container"></div>

<style>
	.map-container {
		width: 100%;
		height: 100%;
	}

	/*
		Push the attribution badge up so it clears the scale bar.
		Scale bar sits at bottom-right; attribution at bottom-left is fine as-is.
	*/
	:global(.maplibregl-ctrl-bottom-right) {
		bottom: 0;
		right: 0;
	}
</style>
