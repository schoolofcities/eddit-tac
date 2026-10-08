const COLOURS = ["#99C2F8", "#4D92F1", "#0062EA", "#004EBB", "#00398C"];

export const LAYER_GROUPS = [
  {
    id: "demography",
    label: "Demography",
    exclusive: true,
    ui: "dropdown",
    items: [
      // ── Population ──
      {
        category: "Population",
        id: "pop-density",
        label: "Population Density (per km²)",
        key: "pop_density_pct",
        breaks: [3200, 4550, 6300, 8880],
        colors: COLOURS,
        description: "Residents per square kilometre.",
      },
      {
        category: "Population",
        id: "median-age",
        label: "Median Age",
        key: "age_median_count",
        breaks: [37.2, 40.0, 41.6, 44.4],
        colors: COLOURS,
        description: "Median age of residents.",
      },
      {
        category: "Population",
        id: "avg-household-size",
        label: "Average Household Size",
        key: "pvt_house_avg_size_count",
        breaks: [2.1, 2.4, 2.6, 2.9],
        colors: COLOURS,
        description: "Average number of people living in each household.",
      },
      {
        category: "Population",
        id: "visible-minority",
        label: "Visible Minority Status (%)",
        key: "visible_minority_yes_pct",
        breaks: [31.7, 47.7, 64.7, 79.6],
        colors: COLOURS,
        description:
          "Percentage of population who belong to a visible minority group.",
      },
      // ── Income ──
      {
        category: "Income",
        id: "income-after-tax",
        label: "Median Income After Tax",
        key: "income_aftertax_median_count",
        breaks: [30720, 32800, 36400, 42960],
        colors: COLOURS,
        description:
          "Median income of residents after taxes in Canadian dollars (CAD).",
      },
      {
        category: "Income",
        id: "income",
        label: "Income Inequality (Gini index)",
        key: "gini_total_income_count",
        breaks: [0.29, 0.32, 0.37, 0.42],
        colors: COLOURS,
        description:
          "Income inequality as measured by the Gini index, from 0 (perfect equality) to 1 (maximum inequality). Higher values mean income is more unevenly distributed within the census tract.",
      },
      {
        category: "Income",
        id: "pct-low-income",
        label: "Low Income Households (%)",
        key: "lim_at_prev_pct",
        breaks: [9.1, 11.2, 13.3, 16.7],
        colors: COLOURS,
        description:
          "Percentage of households with income below the low-income threshold, defined at 50% of the median income.",
      },
      // ── Housing ──
      {
        category: "Housing",
        id: "tenure-renter",
        label: "Households that are Renting (%)",
        key: "housing_tenure_renter_pct",
        breaks: [27.9, 40.6, 49.8, 60.7],
        colors: COLOURS,
        description:
          "Percentage of households that are renting as opposed to owning their dwelling.",
      },
      {
        category: "Housing",
        id: "shelter-costs",
        label: "Households spending >30% of Income on Housing (%)",
        key: "housing_shelter_30plus_pct",
        breaks: [25.2, 28.0, 31.4, 36.1],
        colors: COLOURS,
        description:
          "Percentage of households spending over 30% of their income on housing.",
      },
      {
        category: "Housing",
        id: "core-housing-need",
        label: "Core Housing Need (%)",
        key: "housing_core_need_yes_pct",
        breaks: [14.2, 17.8, 20.9, 24.3],
        colors: COLOURS,
        description: 'Percentage of households living in housing that is unaffordable, overcrowded, or in need of major repairs, and who cannot afford acceptable alternative housing in their area.',
      },
      // ── Transportation ──
      {
        category: "Transportation",
        id: "pct-no-vehicle",
        label: "Households with No Vehicle (%)",
        key: "hh_no_veh_pct",
        breaks: [9.74, 15.2, 22.28, 35.92],
        colors: COLOURS,
        description: "Percentage of households that do not have a vehicle.",
      },
      // ── Education ──
      {
        category: "Education",
        id: "pct-bachelors",
        label: "Bachelors and Up (%)",
        key: "education_bachelor_higher_pct",
        breaks: [25.5, 32.4, 41.8, 55.0],
        colors: COLOURS,
        description:
          "Percentage of residents who attained a bachelor's degree or a higher level of education.",
      },
      {
        category: "Education",
        id: "pct-highschool",
        label: "High School and Up (%)",
        key: "education_secondary_pct",
        breaks: [18.9, 22.9, 26.4, 29.2],
        colors: COLOURS,
        description:
          "Percentage of residents who have completed high school or a higher level of education.",
      },
      {
        category: "Education",
        id: "pct-no-education",
        label: "No Education (%)",
        key: "education_none_pct",
        breaks: [8.1, 12.5, 16.7, 20.5],
        colors: COLOURS,
        description: "Percentage of residents who have no formal education.",
      },
      // ── Arts & Culture Labour ──
      {
        category: "Arts & Culture Labour",
        id: "labour-creatives",
        label: "Labour Force in Creative Industries (%)",
        key: "labour_creatives_pct",
        breaks: [0.6, 0.9, 1.58, 3.0],
        colors: COLOURS,
        description:
          "Percentage of the labour force across all roles employed in creative industries. Creative industries include design services, advertising, independent artists, writers and performers (NAICS).",
      },
      {
        category: "Arts & Culture Labour",
        id: "labour-cultural-industries",
        label: "Labour Force in Cultural Industries (%)",
        key: "labour_cultural_industries_pct",
        breaks: [0.9, 1.3, 1.98, 4.2],
        colors: COLOURS,
        description:
          "Percentage of the labour force across all roles employed in cultural industries. Cultural industries include motion picture and video industries, sound recording, broadcasting, and performing arts (NAICS).",
      },
      {
        category: "Arts & Culture Labour",
        id: "labour-cultural-workers",
        label: "Cultural Workers (%)",
        key: "labour_cultural_workers_pct",
        breaks: [1.0, 1.7, 2.5, 5.3],
        colors: COLOURS,
        description:
          "Percentage of the labour force who work directly in cultural roles. Cultural workers include those who actively produce or support media and physical creation. This includes creators such as authors, artists, musicians, as well as cultural managers in institutions such as libraries, museums, and performing arts centres (NOC).",
      },
      {
        category: "Arts & Culture Labour",
        id: "labour-independent-artists",
        label: "Independent Artists (%)",
        key: "labour_independent_artists_pct",
        breaks: [0.0, 0.3, 0.6, 1.3],
        colors: COLOURS,
        description:
          "Percentage of the labour force working as independent artists.",
      },
      {
        category: "Arts & Culture Labour",
        id: "labour-arts-major",
        label: "Arts Majors (%)",
        key: "labour_arts_major_pct",
        breaks: [2.3, 3.52, 5.1, 8.24],
        colors: COLOURS,
        description:
          "Percentage of the labour force who have an educational degree in the arts.",
      },
    ],
  },
  {
    id: "activity",
    label: "Activity",
    exclusive: true,
    ui: "radio-toggles",
    items: [
      {
        id: "activity-all",
        label: "All",
        key: "all",
        breaks: [0.039, 0.107, 0.228, 0.611],
        colors: COLOURS,
      },
      {
        id: "activity-evenings",
        label: "Evenings (5-11PM)",
        key: "evening",
        breaks: [0.043, 0.127, 0.31, 0.891],
        colors: COLOURS,
      },
      {
        id: "activity-daytime",
        label: "Daytime (9AM-5PM)",
        key: "nine-five",
        breaks: [0.05, 0.143, 0.342, 0.981],
        colors: COLOURS,
      },
      {
        id: "activity-weekdays",
        label: "Weekdays",
        key: "weekdays",
        breaks: [0.041, 0.111, 0.244, 0.688],
        colors: COLOURS,
      },
      {
        id: "activity-weekends",
        label: "Weekends",
        key: "weekends",
        breaks: [0.049, 0.147, 0.348, 0.987],
        colors: COLOURS,
      },
    ],
  },
  {
    id: "mobility",
    label: "Mobility",
    exclusive: false,
    ui: "toggles",
    items: [
      { id: "transit-rail", label: "Rail", key: null },
      {
        id: "transit-streetcars-busses",
        label: "Streetcars & Busses",
        key: null,
      },
      {
        id: "commute-time",
        label: "Commute Time (must select venue)",
        key: null,
        period: "commute_time",
        cutoffs: [15, 30, 45, 60],
        colors: ["#2166ac", "#1fac8f", "#f8961e", "#d73027"],
      },
      {
        id: "walk-venues-30min",
        label: "Number of Venues Within a 30 Minute Walk",
        key: "venues_reachable",
        // step thresholds: 1–10 | 11–30 | 31–75 | 76–200 | 200+
        breaks: [11, 31, 76, 201],
        legendLabels: ["1–10", "11–30", "31–75", "76–200", "200+"],
        colors: COLOURS,
      },
    ],
  },
  {
    id: "reference",
    label: "Reference",
    exclusive: true,
    ui: "radio-toggles",
    items: [
      { id: "ref-neighbourhoods", label: "Neighbourhoods", key: null },
      {
        id: "ref-municipalities",
        label: "Municipalities (pre-1998)",
        key: null,
      },
      { id: "ref-wards", label: "City Wards", key: null },
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