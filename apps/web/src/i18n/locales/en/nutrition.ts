export const nutrition = {
  header: {
    eyebrow: 'Nutrition analytics',
    title: 'Calories & Macronutrient Calculator',
    description:
      'Use your profile or temporary overrides to request personalized fitness estimates. All calculations are performed by the nutrition service.',
  },
  regions: {
    inputs: 'Calculator inputs',
    results: 'Nutrition calculation results',
  },
  loading: {
    profile: 'Loading profile inputs',
    latest: 'Loading latest calculation',
    history: 'Loading calculation history',
  },
  errors: {
    profileTitle: 'Profile inputs unavailable',
    profile:
      'We could not load your calculator profile inputs. Please try again.',
    calculation:
      'We could not calculate your nutrition targets. Your entries are still here; please try again.',
    latestTitle: 'Latest calculation unavailable',
    latest: 'We could not load your latest calculation. Please try again.',
    historyTitle: 'History unavailable',
    history: 'We could not load calculation history. Please try again.',
  },
  form: {
    title: 'Your inputs',
    description: 'Values are used for this calculation only.',
    age: 'Age',
    years: 'years',
    gender: 'Gender',
    height: 'Height',
    weight: 'Weight',
    activity: 'Activity level',
    goal: 'Fitness goal',
    select: 'Select {{field}}',
    required: 'Required',
    fromProfile: 'From profile',
    manual: 'Manually entered',
    genderExplanation:
      'Mifflin-St Jeor requires a temporary male or female input. Selecting one here will not change your stored profile preference.',
    calculate: 'Calculate targets',
    calculating: 'Calculating...',
  },
  profile: {
    completeTitle: 'Profile inputs loaded',
    incompleteTitle: 'Profile information is incomplete',
    completeDescription:
      'Profile values are prefilled. Change any field to use a one-time manual override.',
    incompleteDescription:
      'Complete the required blank fields below. Missing: {{fields}}.',
    fields: {
      age: 'age',
      gender: 'gender',
      heightCm: 'heightCm',
      weightKg: 'weightKg',
      activityLevel: 'activityLevel',
      goal: 'goal',
    },
  },
  validation: {
    temporaryGender:
      'This formula requires a temporary male or female selection. Your profile preference will not change.',
    genderRequired: 'Gender is required',
    activityRequired: 'Activity level is required',
    goalRequired: 'Fitness goal is required',
  },
  results: {
    emptyTitle: 'Your result will appear here',
    emptyDescription:
      'Complete the calculator to see estimates returned by the nutrition service.',
    eyebrow: 'Your estimate',
    title: 'Daily nutrition targets',
    calculated: 'Calculated {{date}}',
    recommendedCalories: 'Recommended calories',
    recommendedNote: 'Your goal-adjusted target',
    maintenance: 'Maintenance calories',
    bulking: 'Bulking calories',
    cutting: 'Cutting calories',
    bmr: 'BMR',
    bmrNote: 'Basal metabolic rate estimate',
    tdee: 'TDEE',
    tdeeNote: 'Total daily energy expenditure estimate',
    macrosTitle: 'Macronutrients and hydration',
    protein: 'Protein',
    carbohydrates: 'Carbohydrates',
    carbs: 'Carbs',
    fat: 'Fat',
    water: 'Water',
    bmi: 'BMI {{value}}',
    bmiNote:
      'BMI is a general screening estimate and does not directly measure body composition.',
    adjustments: 'Calculation adjustments',
    safetyFloor: 'A safety calorie floor was applied by the nutrition service.',
    macroFallback:
      'A macro fallback strategy was applied by the nutrition service.',
    method: 'Method: {{method}}',
    version: 'Calculation version: {{version}}',
  },
  latest: {
    title: 'Latest calculation',
    emptyTitle: 'No calculation yet',
    emptyDescription:
      'Your most recent calculation will appear here after you calculate your targets.',
    maintenance: 'Maintenance',
    recommended: 'Recommended',
  },
  history: {
    title: 'Calculation history',
    description: 'Review prior estimates without changing them.',
    sort: 'Sort order',
    newest: 'Newest first',
    oldest: 'Oldest first',
    from: 'From date',
    to: 'To date',
    apply: 'Apply dates',
    clear: 'Clear',
    emptyTitle: 'No calculations found',
    emptyDescription:
      'Try another date range, or complete your first nutrition calculation.',
    pages: 'Nutrition history pages',
    legacy: 'Historical input context not available',
    version: 'Version {{version}}',
    versionUnavailable: 'not available',
    goal: 'Goal',
  },
  disclaimer: {
    label: 'Health disclaimer',
    title: 'Health disclaimer',
    text: 'These estimates are for general fitness guidance and are not medical advice. Individual needs vary; consult a qualified professional for personalized health guidance.',
  },
} as const
