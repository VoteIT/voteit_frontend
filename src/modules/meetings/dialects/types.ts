import { GroupMembership } from '../types'

export interface RoleMembership extends GroupMembership {
  role: number
}
export function isRoleMembership(
  membership: GroupMembership
): membership is RoleMembership {
  return !!membership.role
}
