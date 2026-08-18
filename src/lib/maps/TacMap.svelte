<script>
	import { onMount } from "svelte";
	import maplibregl from "maplibre-gl";
	import "maplibre-gl/dist/maplibre-gl.css";
	import { LAYER_GROUPS } from "./tacLayerConfig.js";
	import torontoBoundary from "$data/toronto-boundary.geo.json";
	import venuesCentroids from "$data/venues-centroids.geo.json";
	import venuesBoundaries from "$data/venues-boundaries.geo.json";
	import artLocations from "$data/current_toronto_arts_locations_eddit.geo.json";
	import mobilityLines from "$data/mobility-lines-simplified.geo.json";
	import subwayStops from "$data/subway-stops.geo.json";
	import goStops from "$data/go-stops.geo.json";
	import torontoAda from "$data/toronto-ada-wide.geo.json";
	import formerMunicipalities from "$data/former-municipalities.geo.json";
	import formerMunicipalitiesLabels from "$data/former-municipalities-labels.geo.json";
	import neighbourhoods from "$data/neighbourhoods.geo.json";
	import neighbourhoodsLabels from "$data/neighbourhoods-labels.geo.json";
	import cityWards from "$data/city-wards.geo.json";
	import cityWardsLabels from "$data/city-wards-labels.geo.json";

	import basemapLayers from "$lib/maps/neutral-grey.json";
	import * as pmtiles from "pmtiles";

	let building_census = "building_census.pmtiles";

	let {
		map = $bindable(null),
		selectedVenueId = $bindable(null),
		layerState = {},
		venueDisplayMode = $bindable("some"), // "some" (venuesCentroids, default) | "all" (artLocations)
	} = $props();

	const MAP_STYLE = {
		version: 8,
		glyphs: "https://schoolofcities.github.io/fonts/fonts/{fontstack}/{range}.pbf",
		sources: {
			openmaptiles: {
				type: "vector",
				url: "https://tiles.openfreemap.org/planet",
			},
		},
		layers: basemapLayers,
	};

	const MAP_CENTER = [-79.363, 43.717];
	const MAP_ZOOM = 10.386;
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
			bearing: -17,
			dragRotate: false,
			touchPitch: false,
			attributionControl: false,
		});

		map.addControl(
			new maplibregl.NavigationControl({ showCompass: false }),
			"top-right",
		);
		map.addControl(
			new maplibregl.ScaleControl({ unit: "metric", maxWidth: 100 }),
			"bottom-right",
		);
		map.addControl(
			new maplibregl.AttributionControl({ compact: true }),
			"bottom-left",
		);

		map.on("load", () => {
			mapLoaded = true;
			addDemographyLayers();
			addActivityLayers();
			addTorontoBoundary();
			addCityWards();
			addNeighbourhoods();
			addFormerMunicipalities();
			addTransitLines();
			addTransitStops();
			addVenueMarkers();
			addArtLocations();
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

		map.addSource("toronto-boundary", {
			type: "geojson",
			data: torontoBoundary,
		});

		// Dim everything outside Toronto with a semi-transparent white fill
		map.addLayer({
			id: "toronto-mask",
			type: "fill",
			source: "toronto-boundary",
			filter: ["==", ["get", "name"], "outside-mask"],
			paint: {
				"fill-color": "#ffffff",
				"fill-opacity": 0.7,
			},
		});

		// Thick border around City of Toronto
		map.addLayer({
			id: "toronto-border",
			type: "line",
			source: "toronto-boundary",
			filter: ["==", ["get", "name"], "Toronto"],
			paint: {
				"line-color": "grey",
				"line-width": 0.8,
				"line-opacity": 1,
			},
		});
	}

	function addNeighbourhoods() {
		if (!map) return;

		map.addSource("neighbourhoods", {
			type: "geojson",
			data: neighbourhoods,
		});

		// Invisible fill — preserves polygon data for future use
		map.addLayer({
			id: "ref-neighbourhoods-fill",
			type: "fill",
			source: "neighbourhoods",
			filter: [
				"in",
				["geometry-type"],
				["literal", ["Polygon", "MultiPolygon"]],
			],
			paint: {
				"fill-color": "#000000",
				"fill-opacity": 0,
			},
			layout: { visibility: "none" },
		});

		// Interior boundary lines only (clipped to Toronto outer edge)
		map.addLayer({
			id: "ref-neighbourhoods",
			type: "line",
			source: "neighbourhoods",
			filter: [
				"in",
				["geometry-type"],
				["literal", ["LineString", "MultiLineString"]],
			],
			paint: {
				"line-color": "#000000",
				"line-width": 0.5,
				"line-opacity": 1,
			},
			layout: { visibility: "none" },
		});

		map.addSource("neighbourhoods-labels", {
			type: "geojson",
			data: neighbourhoodsLabels,
		});

		map.addLayer({
			id: "ref-neighbourhoods-label",
			type: "symbol",
			source: "neighbourhoods-labels",
			minzoom: 12,
			layout: {
				"text-field": ["get", "name"],
				"text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
				"text-size": 10,
				"text-anchor": "center",
				"text-transform": "uppercase",
				"symbol-placement": "point",
				visibility: "none",
			},
			paint: {
				"text-color": "#636363",
				"text-halo-color": "#ffffff",
				"text-halo-width": 1,
				"text-halo-blur": 0,
				"text-opacity": 1,
			},
		});
	}

	function addFormerMunicipalities() {
		if (!map) return;

		map.addSource("former-municipalities", {
			type: "geojson",
			data: formerMunicipalities,
		});

		// Invisible fill — preserves polygon data for future use
		map.addLayer({
			id: "ref-municipalities-fill",
			type: "fill",
			source: "former-municipalities",
			filter: [
				"in",
				["geometry-type"],
				["literal", ["Polygon", "MultiPolygon"]],
			],
			paint: {
				"fill-color": "#000000",
				"fill-opacity": 0,
			},
			layout: { visibility: "none" },
		});

		// Interior boundary lines only (no Toronto outer edge doubling)
		map.addLayer({
			id: "ref-municipalities",
			type: "line",
			source: "former-municipalities",
			filter: [
				"in",
				["geometry-type"],
				["literal", ["LineString", "MultiLineString"]],
			],
			paint: {
				"line-color": "#000000",
				"line-width": 0.5,
				"line-opacity": 1,
			},
			layout: { visibility: "none" },
		});

		map.addSource("former-municipalities-labels", {
			type: "geojson",
			data: formerMunicipalitiesLabels,
		});

		map.addLayer({
			id: "ref-municipalities-label",
			type: "symbol",
			source: "former-municipalities-labels",
			layout: {
				"text-field": ["get", "name"],
				"text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
				"text-size": 12,
				"text-anchor": "center",
				"text-transform": "uppercase",
				"symbol-placement": "point",
				"text-allow-overlap": false,
				"text-ignore-placement": false,
				visibility: "none",
			},
			paint: {
				"text-color": "#636363",
				"text-halo-color": "#ffffff",
				"text-halo-width": 1,
				"text-halo-blur": 0,
				"text-opacity": 1,
			},
		});
	}

	function addCityWards() {
		if (!map) return;

		map.addSource("city-wards", {
			type: "geojson",
			data: cityWards,
		});

		map.addLayer({
			id: "ref-wards-fill",
			type: "fill",
			source: "city-wards",
			filter: [
				"in",
				["geometry-type"],
				["literal", ["Polygon", "MultiPolygon"]],
			],
			paint: {
				"fill-color": "#000000",
				"fill-opacity": 0,
			},
			layout: { visibility: "none" },
		});

		map.addLayer({
			id: "ref-wards",
			type: "line",
			source: "city-wards",
			filter: [
				"in",
				["geometry-type"],
				["literal", ["LineString", "MultiLineString"]],
			],
			paint: {
				"line-color": "#000000",
				"line-width": 0.5,
				"line-opacity": 1,
			},
			layout: { visibility: "none" },
		});

		map.addSource("city-wards-labels", {
			type: "geojson",
			data: cityWardsLabels,
		});

		map.addLayer({
			id: "ref-wards-label",
			type: "symbol",
			source: "city-wards-labels",
			layout: {
				"text-field": ["get", "ward_name"],
				"text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
				"text-size": 9,
				"text-anchor": "center",
				"text-transform": "uppercase",
				"symbol-placement": "point",
				"text-allow-overlap": false,
				"text-ignore-placement": false,
				visibility: "none",
			},
			paint: {
				"text-color": "#636363",
				"text-halo-color": "#ffffff",
				"text-halo-width": 1,
				"text-halo-blur": 0,
				"text-opacity": 1,
			},
		});

		// map.addLayer({
		// 	id: "ref-wards-label",
		// 	type: "symbol",
		// 	source: "city-wards",
		// 	filter: [
		// 		"in",
		// 		["geometry-type"],
		// 		["literal", ["Polygon", "MultiPolygon"]],
		// 	],
		// 	layout: {
		// 		"text-field": ["get", "ward_name"],
		// 		"text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
		// 		"text-size": 11,
		// 		"text-anchor": "center",
		// 		"symbol-placement": "point",
		// 		visibility: "none",
		// 	},
		// 	paint: {
		// 		"text-color": "#333333",
		// 		"text-halo-color": "#ffffff",
		// 		"text-halo-width": 1,
		// 	},
		// });
	}

	function addVenueMarkers() {
		if (!map) return;

		// ── Sources ────────────────────────────────────────────────────────
		map.addSource("venues-centroids", {
			type: "geojson",
			data: venuesCentroids,
			promoteId: "fid",
		});

		map.addSource("venues-boundaries", {
			type: "geojson",
			data: venuesBoundaries,
			promoteId: "fid",
		});

		const someVisibility = venueDisplayMode === "all" ? "none" : "visible";

		// ── Boundary layers (visible at zoom ≥ 15) ──────────────────────────
		map.addLayer({
			id: "venues-fill",
			type: "fill",
			source: "venues-boundaries",
			minzoom: 15,
			paint: {
				"fill-color": "#1E3765",
				"fill-opacity": 0.08,
			},
			layout: { visibility: someVisibility },
		});

		map.addLayer({
			id: "venues-outline",
			type: "line",
			source: "venues-boundaries",
			minzoom: 15,
			paint: {
				"line-color": "#1E3765",
				"line-width": 1.5,
				"line-opacity": 0.7,
			},
			layout: { visibility: someVisibility },
		});

		// ── Centroid dot layers (visible by default — "Some" mode) ─────────
		map.addLayer({
			id: "venues-halo",
			type: "circle",
			source: "venues-centroids",
			maxzoom: 15,
			paint: {
				"circle-radius": [
					"interpolate",
					["linear"],
					["zoom"],
					10,
					8,
					15,
					14,
				],
				"circle-color": "#ffffff",
				"circle-opacity": 0,
				"circle-stroke-width": 0,
			},
			layout: { visibility: someVisibility },
		});

		map.addLayer({
			id: "venues-circle",
			type: "circle",
			source: "venues-centroids",
			maxzoom: 15,
			paint: {
				"circle-radius": [
					"interpolate",
					["linear"],
					["zoom"],
					10,
					3,
					15,
					10,
				],
				"circle-color": "#1E3765",
				"circle-stroke-width": 1.5,
				"circle-stroke-color": "#ffffff",
			},
			layout: { visibility: someVisibility },
		});

		// ── Click handlers ────────────────────────────────────────────────
		const handleVenueClick = (e) => {
			const feature = e.features?.[0];
			if (feature) selectedVenueId = feature.properties.id;
		};
		map.on("click", "venues-circle", handleVenueClick);
		map.on("click", "venues-fill", handleVenueClick);

		// ── Hover popup (desktop / fine-pointer only) ─────────────────────
		const supportsHover = window.matchMedia(
			"(hover: hover) and (pointer: fine)",
		).matches;

		if (supportsHover) {
			const hoverPopup = new maplibregl.Popup({
				closeButton: false,
				closeOnClick: false,
				offset: 12,
				className: "venue-hover-popup",
			});

			map.on("mouseenter", "venues-circle", (e) => {
				map.getCanvas().style.cursor = "pointer";
				const f = e.features[0];
				hoverPopup
					.setLngLat(f.geometry.coordinates)
					.setHTML(`<span>${f.properties.venue_name}</span>`)
					.addTo(map);
			});
			map.on("mouseleave", "venues-circle", () => {
				map.getCanvas().style.cursor = "";
				hoverPopup.remove();
			});
		} else {
			map.on("mouseenter", "venues-circle", () => {
				map.getCanvas().style.cursor = "pointer";
			});
			map.on("mouseleave", "venues-circle", () => {
				map.getCanvas().style.cursor = "";
			});
		}

		map.on("mouseenter", "venues-fill", () => {
			map.getCanvas().style.cursor = "pointer";
		});
		map.on("mouseleave", "venues-fill", () => {
			map.getCanvas().style.cursor = "";
		});
	}

	const TAC_FUNDED_COLOR = [
		"case",
		[
			"any",
			["==", ["get", "TAC_funded_activities"], true]
		],
		"rgb(0, 98, 234)",
		"#9c9c9c",
	];

	function addArtLocations() {
		if (!map) return;

		map.addSource("art-locations", {
			type: "geojson",
			data: artLocations,
		});

		map.addLayer({
			id: "art-locations-circle",
			type: "circle",
			source: "art-locations",
			paint: {
				"circle-radius": 3,
				"circle-color": TAC_FUNDED_COLOR,
				"circle-stroke-width": 1,
				"circle-stroke-color": "#ffffff",
			},
			layout: {
				visibility: venueDisplayMode === "all" ? "visible" : "none",
			},
		});
	}

	function addTransitLines() {
		if (!map) return;

		map.addSource("mobility-lines", {
			type: "geojson",
			data: mobilityLines,
		});

		const modes = [
			{ id: "transit-rail", mode: "rail", color: "#1E3765" },
			{
				id: "transit-streetcars-busses",
				mode: "surface",
				color: "#1E3765",
			},
		];

		for (const mode of modes) {
			map.addLayer({
				id: mode.id,
				type: "line",
				source: "mobility-lines",
				filter: ["==", ["get", "mode"], mode.mode],
				paint: {
					"line-color": mode.color,
					"line-width": 1,
					"line-opacity": 1,
				},
				layout: {
					visibility: "none",
				},
			});
		}
	}

	function addTransitStops() {
		if (!map) return;

		map.addSource("subway-stops", {
			type: "geojson",
			data: subwayStops,
		});

		map.addSource("go-stops", {
			type: "geojson",
			data: goStops,
		});

		map.addLayer({
			id: "transit-subway-stops",
			type: "circle",
			source: "subway-stops",
			paint: {
				"circle-radius": 3,
				"circle-color": "#fff",
				"circle-stroke-width": 1,
				"circle-stroke-color": "#1E3765",
			},
			layout: {
				visibility: "none",
			},
		});

		map.addLayer({
			id: "transit-go-stops",
			type: "circle",
			source: "go-stops",
			paint: {
				"circle-radius": 3,
				"circle-color": "#fff",
				"circle-stroke-width": 1,
				"circle-stroke-color": "#1E3765",
			},
			layout: {
				visibility: "none",
			},
		});
	}

	const ZOOM_TRANSITION = 15;
	const FILL_OPACITY = 0.4;

	function addDemographyLayers() {
		if (!map) return;

		map.addSource("toronto-ada", {
			type: "geojson",
			data: torontoAda,
			promoteId: "ADAUID",
		});

		map.addSource("building-census", {
			type: "vector",
			url: `pmtiles://${building_census}`,
		});

		const demographyGroup = LAYER_GROUPS[0];
		for (const item of demographyGroup.items) {
			const fillColor = [
				"step",
				["get", item.key],
				item.colors[0],
				...item.breaks.flatMap((b, i) => [b, item.colors[i + 1]]),
			];

			const caseColor = [
				"case",
				["!=", ["get", item.key], null],
				fillColor,
				"#cbcbcb",
			];

			map.addLayer({
				id: item.id,
				type: "fill",
				source: "toronto-ada",
				maxzoom: ZOOM_TRANSITION,
				paint: {
					"fill-color": caseColor,
					"fill-opacity": FILL_OPACITY,
				},
				layout: { visibility: "none" },
			});

			map.addLayer({
				id: `${item.id}-buildings`,
				type: "fill",
				source: "building-census",
				"source-layer": "buildings_with_census",
				minzoom: ZOOM_TRANSITION,
				paint: {
					"fill-color": caseColor,
					"fill-opacity": FILL_OPACITY,
					"fill-outline-color": [
						"interpolate",
						["linear"],
						["zoom"],
						ZOOM_TRANSITION,
						"rgba(0, 0, 0, 0)",
						18,
						"rgba(0, 0, 0, 0)",
					],
				},
				layout: { visibility: "none" },
			});
		}
	}

	function activityFillColor(item) {
		const stepColor = [
			"step",
			["feature-state", item.key],
			item.colors[0],
			...item.breaks.flatMap((b, i) => [b, item.colors[i + 1]]),
		];

		return [
			"case",
			[
				"any",
				["==", ["feature-state", item.key], null],
				["==", ["feature-state", item.key], 0],
			],
			"#cbcbcb",
			stepColor,
		];
	}

	function addActivityLayers() {
		if (!map) return;

		const activityGroup = LAYER_GROUPS.find((g) => g.id === "activity");
		for (const item of activityGroup.items) {
			map.addLayer({
				id: item.id,
				type: "fill",
				source: "toronto-ada",
				paint: {
					"fill-color": activityFillColor(item),
					"fill-opacity": FILL_OPACITY,
				},
				layout: { visibility: "none" },
			});
		}
	}

	const activityDataCache = new Map();

	async function loadVenueActivityData(venueId) {
		if (activityDataCache.has(venueId)) return activityDataCache.get(venueId);

		let data = null;
		try {
			const response = await fetch(`venue_home_origin/venue_${venueId}.json`);
			if (response.ok) data = await response.json();
		} catch {
			data = null;
		}

		activityDataCache.set(venueId, data);
		return data;
	}

	// Clears any previously-set activity feature-state, then (if a venue is
	// selected) fetches its data and re-attaches it per ADA. Runs on every
	// venue change regardless of whether an activity layer is currently
	// visible, so the data's already in place by the time someone clicks one.
	async function applyActivityFeatureState(venueId) {
		if (!map || !map.getSource("toronto-ada")) return;

		map.removeFeatureState({ source: "toronto-ada" });
		if (!venueId) return;

		const data = await loadVenueActivityData(venueId);
		if (!data) return;

		for (const [adaId, values] of Object.entries(data)) {
			map.setFeatureState({ source: "toronto-ada", id: adaId }, values);
		}
	}

	const commuteTimeItem = LAYER_GROUPS.find(
		(g) => g.id === "mobility",
	).items.find((i) => i.id === "commute-time");

	function commuteTimeUrl(period, venueId) {
		return `pmtiles://${period}/venue_${venueId}.pmtiles`;
	}


	function setCommuteTimeLayer(period, venueId, visible) {
		if (!map || !venueId) return;

		const id = `commute-time-${period}`;

		if (map.getLayer(id)) map.removeLayer(id);
		if (map.getSource(id)) map.removeSource(id);

		map.addSource(id, {
			type: "vector",
			url: commuteTimeUrl(period, venueId),
		});

		map.addLayer(
			{
				id,
				type: "fill",
				source: id,
				"source-layer": `venue_${venueId}`,
				paint: commuteTimePaint(),
				layout: { visibility: visible ? "visible" : "none" },
			},
			"ref-wards-fill", // keep it in the same stacking slot it used to occupy
		);
	}

	function commuteTimePaint() {
		return {
			"fill-color": [
				"match",
				["get", "cutoff_min"],
				...commuteTimeItem.cutoffs.flatMap((cutoff, i) => [
					cutoff,
					commuteTimeItem.colors[i],
				]),
				"rgba(0,0,0,0)",
			],
			"fill-outline-color": "#000000",
			"fill-opacity": 0.5,
		};
	}

	function syncLayers() {
		if (!map || !mapLoaded) return;

		for (const group of LAYER_GROUPS) {
			for (const item of group.items) {
				const isVisible = group.exclusive
					? layerState[group.id]?.activeId === item.id
					: (layerState[group.id]?.[item.id] ?? false);

				// Always set visibility for known layers
				const visibility = isVisible ? "visible" : "none";

				switch (item.id) {
					case "pop-density":
					case "median-age":
					case "avg-household-size":
					case "income":
					case "income-after-tax":
					case "pct-low-income":
					case "pct-bachelors":
					case "pct-no-education":
					case "pct-highschool":
					// case "nocs-arts":
					// case "naics-arts":
					case "labour-creatives":
					case "labour-cultural-workers":
					case "labour-cultural-industries":
					case "labour-independent-artists":
					case "labour-arts-major":
					case "shelter-costs":
					case "tenure-renter":
					case "core-housing-need":
					case "citizenship":
					case "visible-minority":
					case "pct-no-vehicle":
						if (map.getLayer(item.id)) {
							map.setLayoutProperty(
								item.id,
								"visibility",
								visibility,
							);
						}
						if (map.getLayer(`${item.id}-buildings`)) {
							map.setLayoutProperty(
								`${item.id}-buildings`,
								"visibility",
								visibility,
							);
						}
						break;

					case "activity-all":
					case "activity-evenings":
					case "activity-daytime":
					case "activity-weekdays":
					case "activity-weekends":
						if (map.getLayer(item.id)) {
							map.setLayoutProperty(
								item.id,
								"visibility",
								visibility,
							);
						}
						break;

					case "transit-rail":
					case "transit-streetcars-busses":
						// case "transit-busses":
						// case "transit-go":
						map.setLayoutProperty(
							item.id,
							"visibility",
							visibility,
						);

						if (item.id === "transit-rail") {
							map.setLayoutProperty(
								"transit-subway-stops",
								"visibility",
								visibility,
							);
						}

						if (item.id === "transit-rail") {
							map.setLayoutProperty(
								"transit-go-stops",
								"visibility",
								visibility,
							);
						}

						break;

					case "commute-time": {
						// Value is now a plain on/off toggle rather than a chosen
						// category id, since only one period (item.period) is wired
						// up.
						const isCommuteOn =
							layerState[group.id]?.[item.id] ?? false;

						if (isCommuteOn && selectedVenueId) {
							setCommuteTimeLayer(
								item.period,
								selectedVenueId,
								true,
							);
						}

						const layerId = `commute-time-${item.period}`;
						if (map.getLayer(layerId)) {
							map.setLayoutProperty(
								layerId,
								"visibility",
								isCommuteOn ? "visible" : "none",
							);
						}
						break;
					}

					case "ref-neighbourhoods":
						if (map.getLayer("ref-neighbourhoods")) {
							map.setLayoutProperty(
								"ref-neighbourhoods",
								"visibility",
								visibility,
							);
							map.setLayoutProperty(
								"ref-neighbourhoods-fill",
								"visibility",
								visibility,
							);
							map.setLayoutProperty(
								"ref-neighbourhoods-label",
								"visibility",
								visibility,
							);
						}
						break;

					case "ref-municipalities":
						if (map.getLayer("ref-municipalities")) {
							map.setLayoutProperty(
								"ref-municipalities",
								"visibility",
								visibility,
							);
							map.setLayoutProperty(
								"ref-municipalities-fill",
								"visibility",
								visibility,
							);
							map.setLayoutProperty(
								"ref-municipalities-label",
								"visibility",
								visibility,
							);
						}
						break;

					case "ref-wards":
						if (map.getLayer("ref-wards")) {
							map.setLayoutProperty(
								"ref-wards",
								"visibility",
								visibility,
							);
							map.setLayoutProperty(
								"ref-wards-fill",
								"visibility",
								visibility,
							);
							map.setLayoutProperty(
								"ref-wards-label",
								"visibility",
								visibility,
							);
						}
						break;
				}
			}
		}
	}

	$effect(() => {
		if (!selectedVenueId || !mapLoaded) return;
		const feature = venuesCentroids.features.find(
			(f) => f.properties.id === selectedVenueId,
		);
		if (feature) {
			map?.easeTo({
				center: feature.geometry.coordinates,
				zoom: 15,
				duration: 800,
			});
		}
	});

	$effect(() => {
		if (!mapLoaded) return;
		const selected = selectedVenueId ?? "";
		const colorExpr = [
			"case",
			["==", ["get", "id"], selected],
			"#DC4633",
			"#000000",
		];

		if (map?.getLayer("venues-circle")) {
			map.setPaintProperty("venues-circle", "circle-color", colorExpr);
		}
		if (map?.getLayer("venues-fill")) {
			map.setPaintProperty("venues-fill", "fill-color", colorExpr);
			map.setPaintProperty("venues-fill", "fill-opacity", [
				"case",
				["==", ["get", "id"], selected],
				0.2,
				0.08,
			]);
		}
		if (map?.getLayer("venues-outline")) {
			map.setPaintProperty("venues-outline", "line-color", colorExpr);
			map.setPaintProperty("venues-outline", "line-width", [
				"case",
				["==", ["get", "id"], selected],
				2.5,
				1.5,
			]);
		}
	});

	// Handles switching venues while the commute-time toggle is already on:
	// rebuilds that layer pointed at the newly selected venue's pmtiles file.
	$effect(() => {
		if (!mapLoaded || !selectedVenueId) return;
		const isCommuteOn = layerState.mobility?.["commute-time"] ?? false;
		if (isCommuteOn) {
			setCommuteTimeLayer(commuteTimeItem.period, selectedVenueId, true);
		}
	});

	// Refreshes the Activity layers' feature-state whenever the selected venue
	// changes, whether or not an activity layer is currently visible — so the
	// data's already in place if/when one gets toggled on.
	$effect(() => {
		if (!mapLoaded) return;
		applyActivityFeatureState(selectedVenueId);
	});

	// Toggles between the "Some" (venue centroid/boundary markers, default)
	// and "All" (art-locations dots colored by TAC_funded_activities) views.
	$effect(() => {
		if (!map || !mapLoaded) return;

		const showAll = venueDisplayMode === "all";
		const someLayerIds = [
			"venues-halo",
			"venues-circle",
			"venues-fill",
			"venues-outline",
		];

		for (const id of someLayerIds) {
			if (map.getLayer(id)) {
				map.setLayoutProperty(
					id,
					"visibility",
					showAll ? "none" : "visible",
				);
			}
		}

		if (map.getLayer("art-locations-circle")) {
			map.setLayoutProperty(
				"art-locations-circle",
				"visibility",
				showAll ? "visible" : "none",
			);
		}
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
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}
	:global(.venue-hover-popup .maplibregl-popup-tip) {
		border-top-color: rgba(30, 55, 101, 0.92);
	}
</style>