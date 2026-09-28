import restApi from '@/utils/restApi'
import type {
  CurrentTermsOfService,
  GlobalTermsOfService,
  TermsOfService
} from './types'

const ENDPOINT = 'terms-of-service/'

/** Every published version of the global terms, newest first. */
export function listGlobalTos() {
  return restApi.get<GlobalTermsOfService[]>('global-terms-of-service/')
}

/** The terms users accept, global and the organisation's. Works anonymously. */
export function getCurrentTos() {
  return restApi.get<CurrentTermsOfService>(`${ENDPOINT}current/`)
}

/** Publish a new version, which users must accept. Takes effect now. */
export function createTos(body: string) {
  return restApi.post<TermsOfService>(ENDPOINT, { body })
}

/** Correct a version, keeping its date. Users are not asked again. */
export function updateTos(pk: number, body: string) {
  return restApi.patch<TermsOfService>(`${ENDPOINT}${pk}/`, { body })
}
