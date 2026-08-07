export const profile = {
  header: {
    eyebrow: 'Personal fitness context',
    title: 'Profile',
    description:
      'Keep your core fitness details accurate for consistent nutrition inputs and dashboard context.',
    completion: '{{percentage}} complete',
  },
  regions: { form: 'Profile details', sidebar: 'Profile context' },
  loading: {
    profile: 'Loading profile',
    completeness: 'Loading profile completeness',
    summary: 'Loading profile summary',
  },
  errors: {
    profileTitle: 'Profile unavailable',
    profile: 'We could not load your profile. Please try again.',
    completenessTitle: 'Completeness unavailable',
    completeness: 'We could not load profile completeness. Please try again.',
    summaryTitle: 'Summary unavailable',
    summary: 'We could not load your profile summary. Please try again.',
    save: 'We could not save your changes. Your entries are still here; please try again.',
  },
  missingProfile: {
    title: 'Complete your profile',
    description:
      'Complete your profile to personalize nutrition, dashboard insights, and future coaching.',
  },
  form: {
    title: 'Profile details',
    description: 'Only changed fields are sent when you save.',
    fullName: 'Full name',
    birthDate: 'Birth date',
    gender: 'Gender',
    height: 'Height',
    weight: 'Current weight',
    activity: 'Activity level',
    goal: 'Fitness goal',
    select: 'Not specified',
    genderHelp:
      '“Prefer not to say” remains available; the nutrition calculator can request a temporary formula input separately.',
    weightHelp:
      'Updating your profile weight does not add a Weight Tracker history entry.',
    save: 'Save changes',
    saving: 'Saving changes...',
    discard: 'Discard changes',
    noChanges: 'No unsaved changes',
  },
  completeness: {
    title: 'Profile completeness',
    complete: 'Profile complete',
    incomplete: 'Missing information',
    progressLabel: 'Profile is {{percentage}} complete',
    missingTitle: 'Complete these fields:',
    allSet: 'All core profile information is available.',
  },
  summary: {
    title: 'Profile summary',
    displayName: 'Display name',
    age: 'Age',
    gender: 'Gender',
    height: 'Height',
    weight: 'Current weight',
    activity: 'Activity level',
    goal: 'Fitness goal',
    completeness: 'Completeness',
    yearsOld: '{{value}} years old',
  },
  context: {
    title: 'How these details are used',
    nutrition:
      'Birth date, gender, height, weight, activity, and goal can prefill the Calories Calculator.',
    dashboard:
      'Dashboard weight uses your latest logged body measurement first and this profile weight as a fallback.',
  },
  feedback: { saved: 'Profile saved successfully.' },
  fields: {
    fullName: 'Full name',
    birthDate: 'Birth date',
    gender: 'Gender',
    heightCm: 'Height',
    currentWeightKg: 'Current weight',
    activityLevel: 'Activity level',
    fitnessGoal: 'Fitness goal',
  },
  validation: {
    nameLength: 'Full name must be between 2 and 100 characters',
    birthDateInvalid: 'Enter a valid birth date',
    birthDateRange: 'Birth date must represent an age between 14 and 100',
  },
} as const
