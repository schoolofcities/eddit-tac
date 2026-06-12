<script>
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { LAYER_GROUPS } from './tacLayerConfig.js';
	import torontoBoundary from '$data/toronto-boundary.geo.json';
	import venuesCentroids from '$data/venues-centroids.geo.json';
	import venuesBoundaries from '$data/venues-boundaries.geo.json';
	import mobilityLines from '$data/mobility-lines.geo.json';
	import subwayStops from '$data/subway-stops.geo.json';
	import goStops from '$data/go-stops.geo.json';
	import torontoAda from '$data/toronto-ada-wide.geo.json';
	import formerMunicipalities from '$data/former-municipalities.geo.json';
	import * as pmtiles from "pmtiles";

	let commute_time = "commute_time.pmtiles";

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

	onMount(() => {

		const protocol = new pmtiles.Protocol();
		maplibregl.addProtocol("pmtiles", protocol.tile);

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
			addDemographyLayers();
			addTorontoBoundary();
			addFormerMunicipalities();
			addCommuteTimeLayer();
			addTransitLines();
			addTransitStops();
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

	function addFormerMunicipalities() {
		if (!map) return;

		map.addSource('former-municipalities', {
			type: 'geojson',
			data: formerMunicipalities,
		});

		// Invisible fill — preserves polygon data for future use
		map.addLayer({
			id: 'ref-municipalities-fill',
			type: 'fill',
			source: 'former-municipalities',
			filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
			paint: {
				'fill-color': '#000000',
				'fill-opacity': 0,
			},
			layout: { visibility: 'none' },
		});

		// Interior boundary lines only (no Toronto outer edge doubling)
		map.addLayer({
			id: 'ref-municipalities',
			type: 'line',
			source: 'former-municipalities',
			filter: ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]],
			paint: {
				'line-color': '#4A607F',
				'line-width': 1.5,
				'line-opacity': 0.7,
				'line-dasharray': [6, 5],
			},
			layout: { visibility: 'none' },
		});
	}

	function addVenueMarkers() {
		if (!map) return;

		// ── Sources ────────────────────────────────────────────────────────
		map.addSource('venues-centroids', {
			type: 'geojson',
			data: venuesCentroids,
			promoteId: 'fid',
		});

		map.addSource('venues-boundaries', {
			type: 'geojson',
			data: venuesBoundaries,
			promoteId: 'fid',
		});

		// ── Boundary layers (visible at zoom ≥ 15) ──────────────────────────
		map.addLayer({
			id: 'venues-fill',
			type: 'fill',
			source: 'venues-boundaries',
			minzoom: 15,
			paint: {
				'fill-color': '#1E3765',
				'fill-opacity': 0.08,
			},
		});

		map.addLayer({
			id: 'venues-outline',
			type: 'line',
			source: 'venues-boundaries',
			minzoom: 15,
			paint: {
				'line-color': '#1E3765',
				'line-width': 1.5,
				'line-opacity': 0.7,
			},
		});

		// ── Centroid dot layers (always visible) ──────────────────────────
		map.addLayer({
			id: 'venues-halo',
			type: 'circle',
			source: 'venues-centroids',
			maxzoom: 15,
			paint: {
				'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 8, 15, 14],
				'circle-color': '#ffffff',
				'circle-opacity': 0.9,
				'circle-stroke-width': 0,
			},
		});

		map.addLayer({
			id: 'venues-circle',
			type: 'circle',
			source: 'venues-centroids',
			maxzoom: 15,
			paint: {
				'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 15, 10],
				'circle-color': '#1E3765',
				'circle-stroke-width': 1.5,
				'circle-stroke-color': '#ffffff',
			},
		});

		// ── Click handlers ────────────────────────────────────────────────
		const handleVenueClick = (e) => {
			const feature = e.features?.[0];
			if (feature) selectedVenueId = feature.properties.id;
		};
		map.on('click', 'venues-circle', handleVenueClick);
		map.on('click', 'venues-fill', handleVenueClick);

		// ── Hover popup (desktop / fine-pointer only) ─────────────────────
		const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

		if (supportsHover) {
			const hoverPopup = new maplibregl.Popup({
				closeButton: false,
				closeOnClick: false,
				offset: 12,
				className: 'venue-hover-popup',
			});

			map.on('mouseenter', 'venues-circle', (e) => {
				map.getCanvas().style.cursor = 'pointer';
				const f = e.features[0];
				hoverPopup
					.setLngLat(f.geometry.coordinates)
					.setHTML(`<span>${f.properties.venue_name}</span>`)
					.addTo(map);
			});
			map.on('mouseleave', 'venues-circle', () => {
				map.getCanvas().style.cursor = '';
				hoverPopup.remove();
			});
		} else {
			map.on('mouseenter', 'venues-circle', () => { map.getCanvas().style.cursor = 'pointer'; });
			map.on('mouseleave', 'venues-circle', () => { map.getCanvas().style.cursor = ''; });
		}

		map.on('mouseenter', 'venues-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
		map.on('mouseleave', 'venues-fill', () => { map.getCanvas().style.cursor = ''; });
	}

	function addTransitLines() {
    if (!map) return;

    // Single source for all transit lines
    map.addSource('mobility-lines', {
        type: 'geojson',
        data: mobilityLines,
    });

    // Create a layer for each mode
    const modes = [
        { id: 'transit-subway', mode: 'subway', color: '#1E3765' },
        { id: 'transit-streetcars', mode: 'streetcar', color: '#1E3765' },
        { id: 'transit-busses', mode: 'bus', color: '#1E3765' },
        { id: 'transit-go', mode: 'go', color: '#1E3765' },
    ];

    for (const mode of modes) {
        map.addLayer({
            id: mode.id,
            type: 'line',
            source: 'mobility-lines',
            filter: ['==', ['get', 'mode'], mode.mode],
            paint: {
                'line-color': mode.color,
                'line-width': 1.5,
                'line-opacity': 0.8,
				'line-dasharray': [2, 2]
            },
            layout: {
                'visibility': 'none',
            },
        });
    }
}

function addTransitStops() {
    if (!map) return;

    map.addSource('subway-stops', {
        type: 'geojson',
        data: subwayStops
    });

    map.addSource('go-stops', {
        type: 'geojson',
        data: goStops
    });

    map.addLayer({
        id: 'transit-subway-stops',
        type: 'circle',
        source: 'subway-stops',
        paint: {
            'circle-radius': 3,
            'circle-color': '#fff',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#1E3765'
        },
        layout: {
            visibility: 'none'
        }
    });

    map.addLayer({
        id: 'transit-go-stops',
        type: 'circle',
        source: 'go-stops',
        paint: {
            'circle-radius': 3,
            'circle-color': '#fff',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#1E3765'
        },
        layout: {
            visibility: 'none'
        }
    });
}

function addDemographyLayers() {
    if (!map) return;

    map.addSource('toronto-ada', {
        type: 'geojson',
        data: torontoAda,
    });

    const demographyGroup = LAYER_GROUPS[0];

    for (const item of demographyGroup.items) {

		const fillColor = [
			'step',
			['get', item.key],
			item.colors[0],
			...item.breaks.flatMap((b, i) => [b, item.colors[i + 1]])
		];

        map.addLayer({
            id: item.id,
            type: 'fill',
            source: 'toronto-ada',
            paint: {
                'fill-color': [
                    'case',
                    ['!=', ['get', item.key], null],
                    fillColor,
                    '#cbcbcb'
                ],
                'fill-opacity': 0.7,
            },
            layout: {
                visibility: 'none',
            },
        });
    }
}

function commuteTimePaint(venueId) {
    const col = venueId ? `travel_time_${venueId}` : 'travel_time_1';
    return {
        'fill-color': [
            'case',
            ['==', ['get', col], null], 'rgba(0,0,0,0)',
            ['step', ['get', col],
                '#2166ac',
                15, '#1fa187',
                30, '#fde725',
                45, '#f8961e',
                // 60, '#d73027',
            ]
			// ['interpolate', ['linear'], ['get', col],
            //     0,  '#2166ac',
            //     15, '#1fa187',
            //     30, '#fde725',
            //     45, '#f8961e',
            //     60, '#d73027',
            // ]
        ],
        'fill-opacity': [
            'case',
            ['==', ['get', col], null], 0,
            0.6
        ],
    };
}

function addCommuteTimeLayer() {
    if (!map) return;

    map.addSource('commute-time', {
        type: 'vector',
        url: `pmtiles://${commute_time}`,
    });

    const paint = commuteTimePaint(selectedVenueId);
    map.addLayer({
        id: 'commute-time',
        type: 'fill',
        source: 'commute-time',
        'source-layer': 'commute_time',
        paint,
        layout: {
            'visibility': 'none',
        },
    });
}

function syncLayers() {
    if (!map || !mapLoaded) return;

    for (const group of LAYER_GROUPS) {
        for (const item of group.items) {
            const isVisible = group.exclusive
                ? layerState[group.id]?.activeId === item.id
                : (layerState[group.id]?.[item.id] ?? false);

            // Always set visibility for known layers
            const visibility = isVisible ? 'visible' : 'none';

            switch (item.id) {
                case 'pop-density':
				case 'pop-count':
                case 'median-age':
                case 'avg-household-size':
                case 'income':
				case 'income-after-tax':
				case 'pct-low-income':
                case 'pct-bachelors':
				case 'pct-no-education':
                case 'pct-highschool':
                case 'nocs-arts':
                case 'naics-arts':
                case 'shelter-costs':
				case 'tenure-renter':
                case 'core-housing-need':
                case 'citizenship':
                case 'visible-minority':
                    if (map.getLayer(item.id)) {
                        map.setLayoutProperty(item.id, 'visibility', visibility);
                    }
                    break;

                case 'activity-all':
                case 'activity-evenings':
                case 'activity-daytime':
                case 'activity-weekdays':
                case 'activity-weekends':
                    // TODO: activity map layer
                    if (map.getLayer(item.id)) {
                        map.setLayoutProperty(item.id, 'visibility', visibility);
                    }
                    break;

					case 'transit-subway':
					case 'transit-streetcars':
					case 'transit-busses':
					case 'transit-go':
						map.setLayoutProperty(item.id, 'visibility', visibility);

						if (item.id === 'transit-subway') {
							map.setLayoutProperty('transit-subway-stops', 'visibility', visibility);
						}

						if (item.id === 'transit-go') {
							map.setLayoutProperty('transit-go-stops', 'visibility', visibility);
						}

						break;

                case 'commute-time':
                    // TODO: requires selectedVenueId
                    if (map.getLayer(item.id)) {
                        map.setLayoutProperty(item.id, 'visibility', visibility);
                    }
                    break;

                case 'ref-neighbourhoods':
                    if (map.getLayer(item.id)) {
                        map.setLayoutProperty(item.id, 'visibility', visibility);
                    }
                    break;

                case 'ref-municipalities':
                    if (map.getLayer('ref-municipalities')) {
                        map.setLayoutProperty('ref-municipalities', 'visibility', visibility);
                        map.setLayoutProperty('ref-municipalities-fill', 'visibility', visibility);
                    }
                    break;
            }
        }
    }
}

	$effect(() => {
		if (!selectedVenueId || !mapLoaded) return;
		const feature = venuesCentroids.features.find(
			(f) => f.properties.id === selectedVenueId
		);
		if (feature) {
			map?.flyTo({ center: feature.geometry.coordinates, zoom: 14, duration: 800 });
		}
	});

	$effect(() => {
		if (!mapLoaded) return;
		const selected = selectedVenueId ?? '';
		const colorExpr = ['case', ['==', ['get', 'id'], selected], '#DC4633', '#1E3765'];

		if (map?.getLayer('venues-circle')) {
			map.setPaintProperty('venues-circle', 'circle-color', colorExpr);
		}
		if (map?.getLayer('venues-fill')) {
			map.setPaintProperty('venues-fill', 'fill-color', colorExpr);
			map.setPaintProperty('venues-fill', 'fill-opacity',
				['case', ['==', ['get', 'id'], selected], 0.2, 0.08]);
		}
		if (map?.getLayer('venues-outline')) {
			map.setPaintProperty('venues-outline', 'line-color', colorExpr);
			map.setPaintProperty('venues-outline', 'line-width',
				['case', ['==', ['get', 'id'], selected], 2.5, 1.5]);
		}
	});

	$effect(() => {
		if (!mapLoaded || !map?.getLayer('commute-time')) return;
		const paint = commuteTimePaint(selectedVenueId);
		map.setPaintProperty('commute-time', 'fill-color', paint['fill-color']);
		map.setPaintProperty('commute-time', 'fill-opacity', paint['fill-opacity']);
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

	/* Venue hover popup */
	:global(.venue-hover-popup .maplibregl-popup-content) {
		padding: 5px 10px;
		background: rgba(30, 55, 101, 0.92);
		color: #fff;
		border-radius: 4px;
		font-family: OpenSans, sans-serif;
		font-size: 0.75rem;
		line-height: 1.3;
		max-width: 220px;
		white-space: normal;
		box-shadow: 0 2px 6px rgba(0,0,0,0.2);
	}
	:global(.venue-hover-popup .maplibregl-popup-tip) {
		border-top-color: rgba(30, 55, 101, 0.92);
	}
</style>
