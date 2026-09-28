import type { LocationQuery } from 'vue-router'

/** Only resume logins on our own pipeline, since the path comes from the address bar. */
const RESUME_PATH = /^\/complete\/[\w-]+\/$/

/** Field the login pipeline reads the accepted version from. */
export const ACCEPT_TOS_FIELD = 'accept_tos'

/**
 * Where to send an answer to a login paused for terms of service, or
 * undefined if the query doesn't name one we trust.
 */
export function getAcceptTosResume(query: LocationQuery) {
  const { partial_token: token, resume_url: resumeURL } = query
  if (typeof token !== 'string' || !token) return
  if (typeof resumeURL !== 'string' || !RESUME_PATH.test(resumeURL)) return
  return (tos: number) => {
    const params = new URLSearchParams({
      partial_token: token,
      [ACCEPT_TOS_FIELD]: String(tos)
    })
    return `${resumeURL}?${params}`
  }
}
