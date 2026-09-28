import restApi from '@/utils/restApi'
import type { TermsOfService } from './types'

const ENDPOINT = 'terms-of-service/'

/**
 * Organisation managers get every version, others only the active one.
 * Newest first.
 */
export function listTos() {
  return restApi.get<TermsOfService[]>(ENDPOINT)
}

/** Publish a new version, which users must accept. Takes effect now. */
export function createTos(body: string) {
  return restApi.post<TermsOfService>(ENDPOINT, { body })
}

/** Correct a version, keeping its date. Users are not asked again. */
export function updateTos(pk: number, body: string) {
  return restApi.patch<TermsOfService>(`${ENDPOINT}${pk}/`, { body })
}
