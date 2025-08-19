import { meetingGroupTablePlugins } from '../registry'
import { MeetingGroupColumn, MeetingState } from '../types'
import useMeetingGroups from '../useMeetingGroups'

import SFSVoteManagement from './SFSVoteManagement.vue'
import GroupDelegationManagement from './GroupDelegationManagement.vue'
import useElectoralRegisters from '../electoralRegisters/useElectoralRegisters'
// import MainAndSubstManagement from './MainAndSubstManagement.vue'

export const voteManagementComponents: Partial<
  Record<string, MeetingGroupColumn['component']>
> = {
  // Currently not neccessary
  // ordinarie_och_ersattare: MainAndSubstManagement,
  sfsfum: SFSVoteManagement
} as const

meetingGroupTablePlugins.register({
  id: 'groupVotes',
  checkActive(meeting) {
    return meeting.group_votes_active
  },
  transform(columns, meeting) {
    const component =
      voteManagementComponents[
        meeting.dialect?.view_components?.votes_management as string
      ] // Weird annotation, but undefined works as key
    const { meetingGroups } = useMeetingGroups(meeting.pk)
    return [
      ...columns,
      {
        component,
        name: 'groupVotes',
        getCount() {
          return meetingGroups.value.reduce((acc, g) => acc + (g.votes || 0), 0)
        },
        getTitle(t) {
          return t('meeting.groups.votes')
        },
        getValue(group) {
          return component ? '' : group.votes || '-'
        }
      }
    ]
  }
})

meetingGroupTablePlugins.register({
  id: 'mainAndSubst',
  checkActive(meeting) {
    return (
      [MeetingState.Upcoming, MeetingState.Ongoing].includes(meeting.state) &&
      ['main_subst_active', 'main_subst_delegate'].includes(
        meeting.er_policy_name!
      ) &&
      !!useElectoralRegisters(meeting.pk).currentElectoralRegister.value
    )
  },
  transform(columns, meeting) {
    const { usersInCurrentRegister } = useElectoralRegisters(meeting.pk)
    return [
      ...columns,
      {
        name: 'electoralRegister',
        getDescription(t) {
          return t('electoralRegister.inCurrentDescriptionGroup')
        },
        getTitle(t) {
          return t('electoralRegister.inCurrent')
        },
        getValue(group) {
          return group.memberships.reduce(
            (acc, { user }) =>
              usersInCurrentRegister.value.has(user) ? acc + 1 : acc,
            0
          )
        }
      }
    ]
  }
})

meetingGroupTablePlugins.register({
  id: 'group_delegations',
  checkActive(meeting) {
    return !!meeting.dialect?.groups_can_delegate
  },
  transform(columns): MeetingGroupColumn[] {
    return [
      ...columns,
      {
        component: GroupDelegationManagement,
        name: 'delegate_to',
        getTitle(t) {
          return t('meeting.groups.delegations')
        }
      }
    ]
  }
})
