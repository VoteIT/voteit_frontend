import useAuthentication from '@/composables/useAuthentication'

import useContextRoles from '@/composables/useContextRoles'
import { OrganisationRole } from './types'

const { user } = useAuthentication()
const { hasRole } = useContextRoles('organisation') // Avoid circular import

// Special rule case: Accept organisation by pk. We won't always have organization data.
export function isOrganisationManager (org?: number): boolean {
  if (!user.value) return false
  return hasRole(org || user.value.organisation, OrganisationRole.Manager)
}

export function isMeetingCreator (org?: number): boolean {
  if (!user.value) return false
  return hasRole(org || user.value.organisation, OrganisationRole.MeetingCreator)
}
