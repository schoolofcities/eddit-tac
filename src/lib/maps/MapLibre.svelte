<!-- Simple component for creating a slippy map with MapLibre that loads A) OSM vector data and B) loads data from a .pmtile dataset (buildings in Toronto) -->

<script>

	import '../../assets/global-styles.css';

	import { onMount } from "svelte";

	import maplibregl from "maplibre-gl";
	import "maplibre-gl/dist/maplibre-gl.css";
	import * as pmtiles from "pmtiles";

	let map;

	let buildings = "/design-components/examples/buildings-2025.pmtiles";

	onMount(async () => {

		const protocol = new pmtiles.Protocol();
		maplibregl.addProtocol("pmtiles", protocol.tile);
		
		
		map = new maplibregl.Map({
			container: "map",
			style: {
				version: 8,
				glyphs: "https://schoolofcities.github.io/fonts/fonts/{fontstack}/{range}.pbf",
				sources: {
					osm: {
						type: 'vector',
						tiles: [
						'https://vector.openstreetmap.org/shortbread_v1/{z}/{x}/{y}.mvt'
						]
					}
				},
				layers: [
					{
						id: 'background',
						type: 'background',
						paint: {
							'background-color': '#141414'
						}
					},
					{
						id: 'oceans',
						type: 'fill',
						source: 'osm',
						'source-layer': 'oceans',
						paint: {
							'fill-color': '#2c2f33'
						}
					},
					{
						id: 'water_polygons',
						type: 'fill',
						source: 'osm',
						'source-layer': 'water_polygons',
						paint: {
							'fill-color': '#2c2f33'
						}
					}
				]
			},
			center: [-79.37674, 43.67998],
			zoom: 13,
			bearing: 0,
			scrollZoom: true,
			minZoom: 10,
			maxZoom: 16,
			projection: "mercator",
			attributionControl: false,
		});

		map.on("load", () => {

			map.addSource("buildings", {
				type: "vector",
				url: "pmtiles://" + buildings,
			});

			map.addLayer({
				id: "buildings-line-shadow",
				type: "line",
				source: "buildings",
				"source-layer": "buildings2025",
				paint: {
					"line-color": "#fff",
					"line-width": 0.25,
					"line-opacity": 0.05
				}
			})

			map.addLayer({
				id: "buildings-fill",
				type: "fill",
				source: "buildings",
				"source-layer": "buildings2025",
				paint: {
					"fill-color": [
						"step",
						["get", "AVG_HEIGHT"],
						"#1E3765",
						20, "#007FA3", 
						50, "#6FC7EA",
						100, "#F1C500",
						200, "#fc5b05",
						400, "#fc054f"
					],
					"fill-opacity": 1,
				}
			});

			map.addLayer({
				id: "buildings-line",
				type: "line",
				source: "buildings",
				"source-layer": "buildings2025",
				paint: {
					"line-color": "#fff",
					"line-width": [
						"interpolate",
						["linear"],
						["zoom"],
						15, 0,
						18, 1,
    				],
					"line-opacity": 1
				}
			})

			map.addLayer({
				id: "buildings-line-tall",
				type: "line",
				source: "buildings",
				"source-layer": "buildings2025",
				filter: [">", "AVG_HEIGHT", 200], 
				paint: {
					"line-color": "#fff",
					"line-width": [
						"interpolate",
						["linear"],
						["zoom"],
						14, 0.25,
						16, 1,
					],
					"line-opacity": 1
				}
			});

		});

	});

</script>



<main>

	<div id="map"></div>

</main>



<style>

	#map {
		height: 100vh;
		width: 100vw;
		background-color: #141414;
		z-index: 0;
	}

</style>