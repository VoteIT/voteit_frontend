import useAuthentication from '@/composables/useAuthentication'

import { OrganizationRole, Predicate } from '../types'
import useContextRoles from '@/composables/useContextRoles'

const { user } = useAuthentication()
const { hasRole } = useContextRoles('organisation') // Avoid circular import

// Special rule case: Accept organisation by pk. We won't always have organization data.
const isManager: Predicate = (org?: number) => {
  if (!user.value) return false
  return hasRole(org || user.value.organisation, OrganizationRole.Manager)
}

const isMeetingCreator: Predicate = (org?: number) => {
  if (!user.value) return false
  return hasRole(org || user.value.organisation, OrganizationRole.MeetingCreator)
}

export default {
  isManager,
  isMeetingCreator
}
