export const aiCoach = {
  header: {
    eyebrow: 'Structured fitness guidance',
    title: 'AI Coach',
    description:
      'Choose a focused review. Your coach interprets existing MetaForm GYM data and returns structured, evidence-based guidance—not an open-ended chat.',
  },
  capabilities: {
    heading: 'What would you like help with?',
    description: 'Available reviews are provided by this server.',
    loading: 'Loading coaching capabilities',
    selectionRequired: 'Selection required',
    choose: 'Choose review',
    selected: 'Selected',
    unknown:
      '{{count}} newer coaching option is not supported by this app yet.',
    unknown_other:
      '{{count}} newer coaching options are not supported by this app yet.',
    PROGRESS_ANALYSIS: {
      title: 'Analyze my progress',
      description:
        'Review recent workouts, strength direction, body weight, and available nutrition context.',
    },
    PLATEAU_DETECTION: {
      title: 'Check for plateaus',
      description:
        'Review bounded performance history for one exercise or custom machine.',
    },
    WORKOUT_PLAN_REVIEW: {
      title: 'Review my workout plan',
      description:
        'Assess the structure, balance, rest days, and prescribed volume of a visible plan.',
    },
    NEXT_WORKOUT_GUIDANCE: {
      title: 'Suggest my next workout target',
      description:
        'Receive conservative guidance for one exercise or machine based on recent sessions.',
    },
    NUTRITION_REVIEW: {
      title: 'Review my nutrition targets',
      description:
        'Interpret your latest saved calorie and macro targets alongside available weight direction.',
    },
    WEEKLY_SUMMARY: {
      title: 'Weekly fitness summary',
      description:
        'Summarize this week’s completed training and available fitness indicators.',
    },
  },
  selection: {
    description: 'Only the information required for this review is requested.',
    sourceType: 'Choose a source',
    sourceTypes: {
      EXERCISE: 'Exercise Library',
      CUSTOM_MACHINE: 'My Machines',
    },
    search: 'Search sources',
    searchPlaceholder: 'Search by name',
    plan: 'Choose a workout plan',
    planPlaceholder: 'Search visible plans',
    selected: 'Selected: {{name}}',
    clear: 'Clear current selection',
    loading: 'Loading source options',
    loadingPlans: 'Loading workout plans',
    noExercises: 'No published exercises match your search.',
    noMachines: 'No machines match your search.',
    noMatches: 'No options match your search.',
    noPlans: 'No visible workout plans match your search.',
    exerciseAlt: 'Thumbnail for {{name}}',
    planDays: '{{training}} training days · {{rest}} rest days',
    noInput:
      'No additional selection is needed. The backend will use your available fitness data.',
  },
  validation: {
    sourceRequired: 'Choose an exercise or custom machine before generating.',
    planRequired: 'Choose a workout plan before generating.',
  },
  generation: {
    action: 'Generate analysis',
    pending: 'Analyzing',
    analyzing: 'Your coach is analyzing your existing fitness data.',
    wait: 'This is a normal non-streaming request. Keep this page open while it completes.',
    privacy:
      'Only the guided selection is sent. The backend securely builds the required fitness context.',
  },
  result: {
    title: 'Coach analysis',
    findings: 'Findings',
    recommendations: 'Recommendations',
    evidence: 'Evidence',
    cautions: 'Cautions',
    priority: 'Priority {{priority}}',
    noFindings: 'No findings were returned.',
    noRecommendations: 'No recommendations were returned.',
    noEvidence: 'No supporting evidence was returned.',
    noCautions: 'No cautions were returned.',
    generatedAt: 'Generated {{date}}',
    version: 'Coach version {{version}}',
    unavailableTitle: 'Analysis unavailable',
    unavailableDescription:
      'This historical session does not contain a completed result.',
  },
  severity: { INFO: 'Information', CAUTION: 'Caution' },
  values: { yes: 'Yes', no: 'No' },
  evidenceMetrics: {
    completed_workouts: 'Completed workouts',
    latest_weight_kg: 'Latest weight',
    previous_weight_kg: 'Previous weight',
    workouts_this_week: 'Workouts this week',
    weight_change_kg: 'Weight change',
  },
  insufficient: {
    title: 'More data will improve this review',
    PROGRESS_ANALYSIS:
      'Track more completed workouts and body measurements, then run this review again.',
    PLATEAU_DETECTION: 'Log a few more completed sessions for this source.',
    WORKOUT_PLAN_REVIEW:
      'Add training days and planned exercises before reviewing the plan again.',
    NEXT_WORKOUT_GUIDANCE:
      'Log at least two completed sessions for this source.',
    NUTRITION_REVIEW:
      'Run the Calories Calculator first to create a saved nutrition target.',
    WEEKLY_SUMMARY:
      'Complete and log workouts during the week to build a useful summary.',
  },
  history: {
    title: 'Previous coaching sessions',
    description:
      'Completed and abandoned guided reviews are retained by the backend.',
    filter: 'Capability',
    allTypes: 'All capabilities',
    loading: 'Loading coaching history',
    empty: 'No coaching sessions yet',
    emptyDescription: 'Generate a guided review and it will appear here.',
    noHeadline: 'No completed analysis',
    open: 'Open details',
    pagination: 'Coaching session pagination',
  },
  statuses: {
    IN_PROGRESS: 'In progress',
    COMPLETED: 'Completed',
    ABANDONED: 'Abandoned',
  },
  languages: { en: 'English result', ar: 'Arabic result' },
  detail: {
    back: 'Back to AI Coach',
    title: 'Coaching session',
    description:
      'This result is shown in the language used when it was generated.',
    loading: 'Loading coaching session',
  },
  errors: {
    title: 'Coaching data unavailable',
    capabilities: 'Coaching capabilities could not be loaded. Try again.',
    history: 'Coaching history could not be loaded. Try again.',
    detail: 'This coaching session could not be found or loaded.',
    generation:
      'The analysis could not be completed. You can retry with a new guided request.',
    unavailable: 'AI Coach is not configured on this server yet.',
  },
  guidanceNote:
    'Recommendations are based on available fitness records and provide general guidance. AI Coach does not change workouts, plans, nutrition, or profile data.',
} as const
