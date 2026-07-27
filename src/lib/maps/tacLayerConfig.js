/**
 * Map layer catalog.
 *
 * group.exclusive: one active item at a time
 * group.ui: UI hint for panel rendering
 * item.key: optional data field key to connect once data is wired
 */

const COLOURS = [
    "#99C2F8",
    "#4D92F1",
    "#0062EA",
    "#004EBB",
    "#00398C"
];

export const LAYER_GROUPS = [
	{
		id: 'demography',
		label: 'Demography',
		exclusive: true,
		ui: 'dropdown',
		items: [
			{ id: 'pop-density', label: 'Population Density (per km²)', key: 'pop_density_pct', breaks: [3200, 4550, 6300, 8880], colors: COLOURS },
			{ id: 'median-age', label: 'Median Age', key: 'age_median_count', breaks: [37.2, 40.0, 41.6, 44.4], colors: COLOURS },
			{ id: 'avg-household-size', label: 'Average Household Size', key: 'pvt_house_avg_size_count', breaks: [2.1, 2.4, 2.6, 2.9], colors: COLOURS },
			{ id: 'income', label: 'Income Inequality (Gini index)', key: 'gini_total_income_count', breaks: [0.29, 0.32, 0.37, 0.42], colors: COLOURS },
			{ id: 'income-after-tax', label: 'Median Income After Tax', key: 'income_aftertax_median_count', breaks: [30720, 32800, 36400, 42960], colors: COLOURS },
			{ id: 'pct-low-income', label: 'Low Income Households (%)', key: 'lim_at_prev_pct', breaks: [9.1, 11.2, 13.3, 16.7], colors: COLOURS },
			{ id: 'pct-bachelors', label: 'Bachelors and Up (%)', key: 'education_bachelor_higher_pct', breaks: [25.5, 32.4, 41.8, 55.0], colors: COLOURS },
			{ id: 'pct-no-education', label: 'No Education (%)', key: 'education_none_pct', breaks: [8.1, 12.5, 16.7, 20.5], colors: COLOURS },
			{ id: 'pct-highschool', label: 'High School and Up (%)', key: 'education_secondary_pct', breaks: [18.9, 22.9, 26.4, 29.2], colors: COLOURS },
			// { id: 'nocs-arts', label: 'NOCs in Arts and Culture (%)', key: 'labour_occupation_5_arts_culture_pct', breaks: [2.1, 3.3, 4.6, 7.9], colors: COLOURS },
			// { id: 'naics-arts', label: 'NAICS in Arts and Culture (%)', key: 'labour_industry_71_arts_pct', breaks: [1.2, 1.5, 2.0, 2.9], colors: COLOURS },
			{ id: 'labour-creatives', label: 'Labour Force in Creative Industries (%)', key: 'labour_creatives_pct', breaks: [0.6, 0.9, 1.58, 3.00], colors: COLOURS },
			{ id: 'labour-cultural-workers', label: 'Cultural Workers (%)', key: 'labour_cultural_workers_pct', breaks: [1.0, 1.7, 2.5, 5.3], colors: COLOURS },
			{ id: 'labour-cultural-industries', label: 'Labour Force in Cultural Industries (%)', key: 'labour_cultural_industries_pct', breaks: [0.9, 1.30, 1.98, 4.20], colors: COLOURS },
			{ id: 'labour-independent-artists', label: 'Independent Artists (%)', key: 'labour_independent_artists_pct', breaks: [0.0, 0.3, 0.6, 1.3], colors: COLOURS },
			{ id: 'labour-arts-major', label: 'Arts Majors (%)', key: 'labour_arts_major_pct', breaks: [2.30, 3.52, 5.10, 8.24], colors: COLOURS },
			{ id: 'shelter-costs', label: 'Households spending >30% of Income on Housing (%)', key: 'housing_shelter_30plus_pct', breaks: [25.2, 28.0, 31.4, 36.1], colors: COLOURS },
			{ id: 'tenure-renter', label: 'Households that are Renting (%)', key: 'housing_tenure_renter_pct', breaks: [27.9, 40.6, 49.8, 60.7], colors: COLOURS },
			{ id: 'core-housing-need', label: 'Core Housing Need (%)', key: 'housing_core_need_yes_pct', breaks: [14.2, 17.8, 20.9, 24.3], colors: COLOURS },
			{ id: 'visible-minority', label: 'Visible Minority Status (%)', key: 'visible_minority_yes_pct', breaks: [31.7, 47.7, 64.7, 79.6], colors: COLOURS },
			{ id: 'pct-no-vehicle', label: 'Households with No Vehicle (%)', key: 'hh_no_veh_pct', breaks: [9.74, 15.20, 22.28, 35.92], colors: COLOURS },
		],
	},
	{
		id: 'activity',
		label: 'Activity',
		exclusive: true,
		ui: 'radio-toggles',
		items: [
			// `key` is the time_period field read out of each venue's
			// static/venue_home_origin/venue_<id>.json (via MapLibre feature-state,
			// since the data is per-venue and fetched at runtime — see TacMap.svelte).
			// `breaks`/`colors` are quintile breakpoints (20/40/60/80th percentile of
			// nonzero % share, pooled across all venues) computed in
			// analysis/activity/interpolate_venue_activity_ct.ipynb, reusing the same
			// blue ramp as the demography layers for visual consistency.
			{ id: 'activity-all', label: 'All', key: 'all', breaks: [0.042, 0.106, 0.221, 0.565], colors: COLOURS },
			{ id: 'activity-evenings', label: 'Evenings (5-11PM)', key: 'evening', breaks: [0.044, 0.123, 0.293, 0.82], colors: COLOURS },
			{ id: 'activity-daytime', label: 'Daytime (9AM-5PM)', key: 'nine-five', breaks: [0.052, 0.146, 0.333, 0.938], colors: COLOURS },
			{ id: 'activity-weekdays', label: 'Weekdays', key: 'weekdays', breaks: [0.043, 0.11, 0.235, 0.638], colors: COLOURS },
			{ id: 'activity-weekends', label: 'Weekends', key: 'weekends', breaks: [0.051, 0.145, 0.33, 0.914], colors: COLOURS },
		],
	},
	{
		id: 'mobility',
		label: 'Mobility',
		exclusive: false,
		ui: 'toggles',
		items: [
			{ id: 'transit-rail', label: 'Rail', key: null },
			{ id: 'transit-streetcars-busses', label: 'Streetcars & Busses', key: null },
			// { id: 'transit-busses', label: 'Busses', key: null },
			{
				id: 'commute-time',
				label: 'Commute Time (must select venue)',
				key: null,
				// Two mutually exclusive periods. Each corresponds to a folder of
				// per-venue pmtiles files in static/ (commute_time_peak/,
				// commute_time_offpeak/), one venue_{id}.pmtiles per venue (see
				// TacMap.svelte). They share the same cutoffs/colors so a single
				// legend applies to both.
				options: [
					{ id: 'peak', label: 'Peak' },
					{ id: 'off-peak', label: 'Off-Peak' },
				],
				// Isochrone cutoff_min values present in each venue's pmtiles file,
				// matched 1:1 with colors below via an exact-match expression in
				// TacMap.svelte's commuteTimePaint(). Must match the tileset's
				// actual cutoff_min values exactly or features render transparent.
				// Single source of truth for map + legend.
				cutoffs: [15, 30, 45, 60],
				colors: ['#2166ac', '#1fac8f', '#f8961e', '#d73027'],
			},
		],
	},
	{
		id: 'reference',
		label: 'Reference',
		exclusive: true,
		ui: 'radio-toggles',
		items: [
			{ id: 'ref-neighbourhoods', label: 'Neighbourhoods', key: null },
			{ id: 'ref-municipalities', label: 'Municipalities (pre-1998)', key: null },
			{ id: 'ref-wards', label: 'City Wards', key: null },
		],
	},
];

export function makeInitialLayerState() {
	const state = {};

	for (const group of LAYER_GROUPS) {
		if (group.exclusive) {
			state[group.id] = { activeId: null };
			continue;
		}

		state[group.id] = {};
		for (const item of group.items) {
			state[group.id][item.id] = item.options ? null : false;
		}
	}

	return state;
}