/**
 * Map layer catalog.
 *
 * group.exclusive: one active item at a time
 * group.ui: UI hint for panel rendering
 * item.key: optional data field key to connect once data is wired
 */
export const LAYER_GROUPS = [
	{
		id: 'demography',
		label: 'Demography',
		exclusive: true,
		ui: 'dropdown',
		items: [
			{ id: 'pop-density', label: 'Population Density', key: null },
			{ id: 'age-0-14', label: 'Ages 0-14', key: null },
			{ id: 'age-15-64', label: 'Ages 15-64', key: null },
			{ id: 'age-65-plus', label: 'Ages 65+', key: null },
			{ id: 'median-age', label: 'Median Age', key: null },
			{ id: 'mean-age', label: 'Mean Age', key: null },
			{ id: 'avg-household-size', label: 'Average Household Size', key: null },
			{ id: 'one-parent-families', label: '% One-Parent Census Families', key: null },
			{ id: 'income', label: 'Income', key: null },
			{ id: 'pct-bachelors', label: '% Bachelors and Up', key: null },
			{ id: 'pct-diploma', label: '% Diploma and Up', key: null },
			{ id: 'pct-highschool', label: '% High School and Up', key: null },
			{ id: 'nocs-arts', label: 'NOCs in Arts and Culture', key: null },
			{ id: 'naics-arts', label: 'NAICS in Arts and Culture', key: null },
			{ id: 'shelter-costs', label: 'Shelter Costs >30% of Income', key: null },
			{ id: 'core-housing-need', label: 'Core Housing Need', key: null },
			{ id: 'citizenship', label: 'Citizenship Status', key: null },
			{ id: 'visible-minority', label: 'Visible Minority Status', key: null },
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
