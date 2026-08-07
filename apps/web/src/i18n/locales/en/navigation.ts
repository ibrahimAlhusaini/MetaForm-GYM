export const navigation = {
  items: {
    home: {
      label: 'Home',
      title: 'Home',
      description: 'Your training and health overview.',
    },
    weights: {
      label: 'Weight Tracker',
      title: 'Weight Tracker',
      description:
        'Build workouts, manage machines, and review strength history.',
    },
    exercises: {
      label: 'Exercise Library',
      title: 'Exercise Library',
      description: 'Browse published movements and training guidance.',
    },
    aiCoach: {
      label: 'AI Coach',
      title: 'AI Coach',
      description:
        'Guided, evidence-based fitness reviews and recommendations.',
    },
    calories: {
      label: 'Calories',
      title: 'Calories Calculator',
      description: 'Calculate calorie, macronutrient, and hydration estimates.',
    },
    plans: {
      label: 'Workout Plans',
      title: 'Workout Plans',
      description: 'Plan creation and scheduling tools will be added later.',
    },
    profile: {
      label: 'Profile',
      title: 'Profile',
      description:
        'Profile details are read-only until the profile stage is implemented.',
    },
  },
  shell: {
    skipToContent: 'Skip to main content',
    toolbar: 'Application toolbar',
    openMenu: 'Open application menu',
    closeMenu: 'Close application menu',
    applicationMenu: 'Application menu',
    navigation: 'Application navigation',
    desktopSidebar: 'Desktop sidebar',
    logout: 'Log out',
    logoutPending: 'Signing out…',
    account: 'Authenticated account',
    signedIn: 'Signed in',
    member: 'Member',
    fitnessAnalytics: 'Fitness analytics',
  },
  notFound: {
    eyebrow: '404',
    title: 'Page not found',
    description:
      'The page you requested does not exist or is not available yet.',
    return: 'Return safely',
    appEyebrow: 'Page not found',
    appTitle: 'This application route does not exist.',
    appDescription:
      'Return home using the link below or choose another section from the navigation.',
    returnDashboard: 'Return home',
  },
  placeholder: { status: 'Planned feature' },
} as const
