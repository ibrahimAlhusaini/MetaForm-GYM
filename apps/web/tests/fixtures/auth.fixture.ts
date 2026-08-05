import type { AuthenticatedUser, AuthResponse } from '../../src/types/auth.js'

export const user: AuthenticatedUser = {
  id: '8b2fd2a7-c66c-4bdf-90b0-f3e38026ea3d',
  email: 'member@example.com',
  role: 'USER',
  isActive: true,
  createdAt: '2026-08-05T09:00:00.000Z',
  profile: {
    fullName: 'Meta Member',
    profileImageUrl: null,
    gender: null,
    heightCm: null,
    currentWeightKg: null,
    birthDate: null,
    fitnessGoal: null,
    activityLevel: null,
  },
}

export const authResponse: AuthResponse = {
  success: true,
  message: 'Login successful',
  data: {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: { fullName: user.profile?.fullName ?? 'Meta Member' },
    },
    accessToken: 'memory-only-access-token',
  },
}
