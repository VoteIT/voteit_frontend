import { Component } from 'vue'

import SFSVoteManagement from './SFSVoteManagement.vue'
import MainAndSubstManagement from './MainAndSubstManagement.vue'
import { GroupMembership, MeetingGroup } from '../types'

export const voteManagementComponents: Partial<Record<string, Component<{ group: MeetingGroup & { memberships: GroupMembership[] } }>>> = {
  main_subst: MainAndSubstManagement,
  sfsfum: SFSVoteManagement
} as const
