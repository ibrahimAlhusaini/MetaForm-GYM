import type {
  ProfileCompleteness,
  ProfileCompletenessResponse,
  ProfileDetail,
  ProfileDetailResponse,
  ProfileSummary,
  ProfileSummaryResponse,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
} from '@metaform/shared-types'
import { apiClient } from '../../../services/api-client.js'

const root = '/profile'

export const fetchProfile = async (): Promise<ProfileDetail> =>
  (await apiClient.get<ProfileDetailResponse>(root)).data.data

export const updateProfile = async (
  input: ProfileUpdateRequest,
): Promise<ProfileDetail> =>
  (await apiClient.patch<ProfileUpdateResponse>(root, input)).data.data

export const fetchProfileCompleteness =
  async (): Promise<ProfileCompleteness> =>
    (await apiClient.get<ProfileCompletenessResponse>(`${root}/completeness`))
      .data.data

export const fetchProfileSummary = async (): Promise<ProfileSummary> =>
  (await apiClient.get<ProfileSummaryResponse>(`${root}/summary`)).data.data
