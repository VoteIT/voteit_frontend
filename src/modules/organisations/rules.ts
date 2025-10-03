import useAuthentication from '@/composables/useAuthentication'

import useContextRoles from '@/composables/useContextRoles'
import { Organisation, OrganisationRole } from './types'

const { user } = useAuthentication()
const { hasRole } = useContextRoles<OrganisationRole>('organisation') // Avoid circular import

// Special rule case: Accept organisation by pk. We won't always have organization data.
export function isOrganisationManager(org?: number): boolean {
  if (!user.value) return false
  return !!hasRole(org || user.value.organisation, OrganisationRole.Manager)
}

export function isMeetingCreator(org?: number): boolean {
  if (!user.value) return false
  return !!hasRole(
    org || user.value.organisation,
    OrganisationRole.MeetingCreator
  )
}

export function canAddMeeting(org?: number): boolean {
  return isMeetingCreator(org) || isOrganisationManager(org)
}

export function canChangeOrganisation(org: Organisation): boolean {
  return isOrganisationManager(org.pk)
}
