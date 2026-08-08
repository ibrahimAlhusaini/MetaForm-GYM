export const strengthPrediction = {
  badge: 'Research Preview',
  title: 'Next Session Strength Estimate',
  horizon: 'Next completed session',
  metrics: {
    latest: 'Latest completed max',
    estimated: 'Estimated next-session max',
    sessions: 'Completed sessions',
    cadence: 'Recent cadence: about every {{days}} days',
    cadenceUnavailable: 'Recent cadence is not available yet.',
  },
  states: {
    calculating: 'Calculating the experimental estimate…',
    unavailable:
      'The strength estimate service is unavailable. Please try again.',
    abstainedTitle: 'An estimate is not available yet',
  },
  reasons: {
    INSUFFICIENT_SOURCE_HISTORY:
      'Log more completed sessions for this exercise or machine before an estimate is shown.',
    NO_COMPLETED_SOURCE_HISTORY:
      'Complete a workout with this exercise or machine first.',
    EXCESSIVE_RECENT_GAP:
      'Your recent history is too old for a current estimate.',
    INVALID_STRENGTH_HISTORY:
      'The available history cannot be used for an estimate.',
    INTERNAL_PREDICTION_UNAVAILABLE:
      'The estimate cannot be calculated right now. Please try again.',
  },
  explanation:
    'This experimental estimate uses your latest completed working maximum as a conservative reference. It is not a prescribed workout load.',
  disclaimer:
    'Actual performance may vary with recovery, technique, fatigue, equipment, and training intent. This preview is not medical guidance or guaranteed progression.',
  actions: { retry: 'Retry' },
  a11y: {
    estimatedWeight: 'Estimated next-session maximum: {{value}} kilograms',
  },
} as const
