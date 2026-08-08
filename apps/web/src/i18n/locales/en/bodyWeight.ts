export const bodyWeight = {
  header: {
    back: 'Back to exercise Weight Tracker',
    eyebrow: 'Body-weight history',
    title: 'Body Weight',
    description:
      'Record body-weight measurements and review a cautious 7-day trend forecast. Body weight is separate from resistance used in workouts.',
  },
  form: {
    title: 'Add body-weight measurement',
    description:
      'Record at a comfortable schedule. More frequent weighing is not required.',
    measuredAt: 'Measured date and time',
    weightKg: 'Body weight (kg)',
    save: 'Save measurement',
    saving: 'Saving measurement…',
  },
  preview: {
    badge: 'Research Preview',
    title: '7-Day Weight Trend',
    horizon: 'Approximately 7 days ahead',
    explanation:
      'This experimental forecast extends your recent weight trend. Actual body weight can vary due to hydration, food intake, measurement timing, and other factors.',
    intervalUnavailable:
      'Prediction range unavailable until enough historical prediction errors exist.',
    disclaimer: 'This experimental trend-based forecast is not guaranteed.',
    medical: 'This forecast is not medical advice.',
  },
  metrics: {
    current: 'Current body weight',
    estimated: 'Estimated weight',
    change: 'Expected change',
    basedOn: 'Based on {{count}} previous measurements',
    cadence: 'Recent cadence: about every {{days}} days',
    cadenceUnavailable: 'Recent cadence unavailable',
  },
  states: {
    calculating: 'Calculating trend forecast…',
    loadingHistory: 'Loading body-weight history…',
    abstainedTitle: 'A trend forecast is not available yet.',
  },
  reasons: {
    INSUFFICIENT_PRIOR_HISTORY:
      'Not enough history for a reliable trend forecast yet. Add body-weight measurements over time.',
    EXCESSIVE_RECENT_GAP:
      'Log a recent body-weight measurement before forecasting. There is no need to weigh more often than is comfortable.',
    INVALID_MEASUREMENT_HISTORY:
      'The measurement history needs review before a forecast can be calculated.',
    NO_RECENT_MEASUREMENT:
      'Add your first body-weight measurement to begin building history.',
    INTERNAL_PREDICTION_UNAVAILABLE:
      'The trend forecast cannot be calculated right now. Please try again later.',
  },
  history: {
    title: 'Body-weight history',
    empty: 'No body-weight measurements yet',
    emptyDescription: 'Add a measurement when you are ready.',
    summary: '{{count}} measurements recorded. Latest: {{latest}} kg.',
    chartLabel:
      'Body-weight history chart with observed measurements and an optional experimental forecast point',
    observed: 'Observed body weight',
    forecast: 'Experimental forecast',
    list: 'Recent body-weight measurements',
  },
  actions: { retry: 'Try again' },
  validation: {
    date: 'Choose a valid date and time that is not in the future.',
    weight: 'Enter a body weight between 30 and 350 kg.',
  },
  errors: {
    history: 'Body-weight history is temporarily unavailable.',
    prediction: 'The trend forecast is temporarily unavailable.',
    save: 'The measurement could not be saved. Check the date and try again.',
  },
  a11y: {
    estimatedWeight: 'Estimated body weight: {{value}} kilograms',
    recordedWeight: 'Recorded body weight: {{value}} kilograms',
  },
} as const
