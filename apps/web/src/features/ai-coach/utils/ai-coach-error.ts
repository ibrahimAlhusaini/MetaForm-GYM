import axios from 'axios'

export const aiCoachGenerationErrorKind = (
  error: unknown,
): 'unavailable' | 'general' =>
  axios.isAxiosError(error) && error.response?.status === 503
    ? 'unavailable'
    : 'general'
