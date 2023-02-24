import { toRef } from 'vue'

import { meetingGroupTablePlugins } from '../registry'
import { MeetingGroupColumn, MeetingState } from '../types'
import useMeetingGroups from '../useMeetingGroups'

import SFSVoteManagement from './SFSVoteManagement.vue'
// import MainAndSubstManagement from './MainAndSubstManagement.vue'

export const voteManagementComponents: Partial<Record<string, MeetingGroupColumn['component']>> = {
  // Currently not neccessary
  // ordinarie_och_ersattare: MainAndSubstManagement,
  sfsfum: SFSVoteManagement
} as const

meetingGroupTablePlugins.register({
  id: 'groupVotes',
  checkActive (meeting) {
    return meeting.group_votes_active
  },
  transform (columns, meeting) {
    const component = voteManagementComponents[meeting.dialect?.name as string] // Weird annotation, but undefined works as key
    const { meetingGroups } = useMeetingGroups(toRef(meeting, 'pk'))
    return [
      ...columns,
      {
        component,
        name: 'groupVotes',
        getCount () {
          return meetingGroups.value.reduce((acc, g) => acc + (g.votes || 0), 0)
        },
        getTitle (t) {
          return t('meeting.groups.votes')
        },
        getValue (group) {
          return component
            ? ''
            : group.votes || '-'
        }
      }
    ]
  }
})

meetingGroupTablePlugins.register({
  id: 'mainAndSubst',
  checkActive (meeting) {
    return (
      [MeetingState.Upcoming, MeetingState.Ongoing].includes(meeting.state) &&
      meeting.er_policy_name === 'main_subst_active'
    )
  },
  transform (columns, meeting) {
    const { voteCount } = useMeetingGroups(toRef(meeting, 'pk'))
    return [
      ...columns,
      {
        name: 'electoralRegister',
        getCount () {
          return voteCount.value
        },
        getTitle (t) {
          return t('electoralRegister.inCurrent')
        },
        getValue (group) {
          return group.memberships.reduce((acc, { votes }) => acc + (votes || 0), 0)
        }
      }
    ]
  }
})
