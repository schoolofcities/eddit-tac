/**
 * Map layer catalog.
 *
 * group.exclusive: one active item at a time
 * group.ui: UI hint for panel rendering
 * item.key: optional data field key to connect once data is wired
 */

const COLOURS = [
    "#EAF0F8",
    "#B8C8E3",
    "#7E99C6",
    "#4A679A",
    "#1E3765"
];

export const LAYER_GROUPS = [
	{
		id: 'demography',
		label: 'Demography',
		exclusive: true,
		ui: 'dropdown',
		items: [
			{ id: 'pop-density', label: 'Population Density (per km²)', key: 'pop_density_pct', breaks: [3200, 4550, 6300, 8880], colors: COLOURS },
			{ id: 'pop-count', label: 'Population Count', key: 'pop_2021_count', breaks: [7280, 8935, 10566, 12204], colors: COLOURS },
			{ id: 'median-age', label: 'Median Age', key: 'age_median_count', breaks: [37.2, 40.0, 41.6, 44.4], colors: COLOURS },
			{ id: 'avg-household-size', label: 'Average Household Size', key: 'pvt_house_avg_size_count', breaks: [2.1, 2.4, 2.6, 2.9], colors: COLOURS },
			{ id: 'income', label: 'Income (Gini index)', key: 'gini_total_income_count', breaks: [0.29, 0.32, 0.37, 0.42], colors: COLOURS },
			{ id: 'income-after-tax', label: 'Median Income After Tax', key: 'income_aftertax_median_count', breaks: [30720, 32800, 36400, 42960], colors: COLOURS },
			{ id: 'pct-low-income', label: '% Low Income', key: 'lim_at_prev_pct', breaks: [9.1, 11.2, 13.3, 16.7], colors: COLOURS },
			{ id: 'pct-bachelors', label: '% Bachelors and Up', key: 'education_bachelor_higher_pct', breaks: [25.5, 32.4, 41.8, 55.0], colors: COLOURS },
			{ id: 'pct-no-education', label: '% No Education', key: 'education_none_pct', breaks: [8.1, 12.5, 16.7, 20.5], colors: COLOURS },
			{ id: 'pct-highschool', label: '% High School and Up', key: 'education_secondary_pct', breaks: [18.9, 22.9, 26.4, 29.2], colors: COLOURS },
			{ id: 'nocs-arts', label: '% NOCs in Arts and Culture', key: 'labour_occupation_5_arts_culture_pct', breaks: [2.1, 3.3, 4.6, 7.9], colors: COLOURS },
			{ id: 'naics-arts', label: '% NAICS in Arts and Culture', key: 'labour_industry_71_arts_pct', breaks: [1.2, 1.5, 2.0, 2.9], colors: COLOURS },
			{ id: 'shelter-costs', label: '% Shelter Costs >30% of Income', key: 'housing_shelter_30plus_pct', breaks: [25.2, 28.0, 31.4, 36.1], colors: COLOURS },
			{ id: 'tenure-renter', label: '% Renting', key: 'housing_tenure_renter_pct', breaks: [27.9, 40.6, 49.8, 60.7], colors: COLOURS },
			{ id: 'core-housing-need', label: '% Core Housing Need', key: 'housing_core_need_yes_pct', breaks: [14.2, 17.8, 20.9, 24.3], colors: COLOURS },
			{ id: 'visible-minority', label: '% Visible Minority Status', key: 'visible_minority_yes_pct', breaks: [31.7, 47.7, 64.7, 79.6], colors: COLOURS },
		],
	},
	{
		id: 'activity',
		label: 'Activity',
		exclusive: true,
		ui: 'radio-toggles',
		items: [
			{ id: 'activity-all', label: 'All', key: null },
			{ id: 'activity-evenings', label: 'Evenings (5-11PM)', key: null },
			{ id: 'activity-daytime', label: 'Daytime (9AM-5PM)', key: null },
			{ id: 'activity-weekdays', label: 'Weekdays', key: null },
			{ id: 'activity-weekends', label: 'Weekends', key: null },
		],
	},
	{
		id: 'mobility',
		label: 'Mobility',
		exclusive: false,
		ui: 'toggles',
		items: [
			{ id: 'transit-subway', label: 'Subway', key: null },
			{ id: 'transit-streetcars', label: 'Streetcars', key: null },
			{ id: 'transit-busses', label: 'Busses', key: null },
			{ id: 'transit-go', label: 'GO Trains', key: null },
			{ id: 'commute-time', label: 'Commute Time (must select venue)', key: null },
		],
	},
	{
		id: 'reference',
		label: 'Reference',
		exclusive: false,
		ui: 'toggles',
		items: [
			{ id: 'ref-neighbourhoods', label: 'Neighbourhoods (census tracts)', key: null },
			{ id: 'ref-municipalities', label: 'Municipalities (pre-1998)', key: null },
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
			state[group.id][item.id] = false;
		}
	}

	return state;
}