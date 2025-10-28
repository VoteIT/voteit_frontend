import useContextRoles from '@/composables/useContextRoles'

import { IOrganisation, OrganisationRole } from './types'
import useAuthStore from '../auth/useAuthStore'

const { hasRole } = useContextRoles<OrganisationRole>('organisation') // Avoid circular import

// Special rule case: Accept organisation by pk. We won't always have organization data.
export function isOrganisationManager(org?: number): boolean {
  const { user } = useAuthStore()
  if (!user) return false
  return !!hasRole(org || user.organisation, OrganisationRole.Manager)
}

export function isMeetingCreator(org?: number): boolean {
  const { user } = useAuthStore()
  if (!user) return false
  return !!hasRole(org || user.organisation, OrganisationRole.MeetingCreator)
}

export function canAddMeeting(org?: number): boolean {
  return isMeetingCreator(org) || isOrganisationManager(org)
}

export function canChangeOrganisation(org: IOrganisation): boolean {
  return isOrganisationManager(org.pk)
}
