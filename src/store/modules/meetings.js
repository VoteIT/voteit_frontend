import { restApi } from '@/utils'
import wu from 'wu'

const FORCE_ROLES_FETCH = false

function sortAgenda (items) {
  items.sort((a, b) => {
    if (a.order < b.order) {
      return -1
    }
    if (a.order > b.order) {
      return 1
    }
    return 0
  })
}

export default {
  namespaced: true,
  state: {
    meetings: new Map(),
    meetingList: [], // Sorted pk list
    agendas: new Map(),
    meetingRoles: new Map()
  },
  getters: {
    orderedMeetings (state) {
      return state.meetingList.map(id => state.meetings.get(id))
    },
    getMeetingRoles: state => meetingId => {
      return [...wu(state.meetingRoles.values())
        .filter(r => r.meeting === meetingId)]
    },
    getRoles: state => (userId, meetingId) => {
      return wu(state.meetingRoles.values())
        .find(r => r.user.pk === userId && r.meeting === meetingId) || { user: {}, assigned: [] }
    },
    getUser: state => (userId, meetingId) => {
      const role = wu(state.meetingRoles.values())
        .find(r => r.user.pk === userId && r.meeting === meetingId)
      if (role) {
        return role.user
      }
      return {}
    },
    getMeeting: state => meetingId => {
      return state.meetings.get(meetingId) || {}
    },
    getAgenda: state => meetingId => {
      return state.agendas.get(meetingId) || []
    }
  },
  mutations: {
    setRoles (state, roles) {
      // Update current value or push new
      roles.forEach(role => {
        state.meetingRoles.set(role.pk, role)
      })
    },
    setMeetings (state, meetings) {
      state.meetingList = meetings.map(m => m.pk)
      meetings.forEach(m => {
        state.meetings.set(m.pk, m)
      })
    },
    updateMeeting (state, meeting) {
      state.meetings.set(meeting.pk, meeting)
      if (meeting.agenda_items) {
        sortAgenda(meeting.agenda_items)
        state.agendas.set(meeting.pk, meeting.agenda_items)
      }
    },
    updateAgenda (state, { t, p }) {
      const item = p.item || p // Can be only a pk
      if (!state.agendas.has(item.meeting)) {
        state.agendas.set(item.meeting, [])
      }
      const agenda = state.agendas.get(item.meeting)
      const index = agenda.findIndex(ai => ai.pk === item.pk)
      switch (t) {
        case 'agenda.added':
        case 'agenda.changed':
          if (index === -1) {
            agenda.push(item)
          } else {
            agenda[index] = item
          }
          sortAgenda(agenda)
          break
        case 'agenda.deleted':
          state.agendas.values().forEach(agenda => {
            const index = agenda.findIndex(ai => ai.pk === item.pk)
            if (index !== -1) {
              agenda.splice(index, 1)
            }
          })
          break
      }
    }
  },
  actions: {
    fetchMeetingRoles ({ commit, getters }, { meetingId, userIds }) {
      const params = { context: meetingId }
      if (userIds) {
        userIds = [...new Set(userIds)] // Reduce to unique values
        if (!FORCE_ROLES_FETCH) {
          // Skip userid's already in store
          const meetingRoles = getters.getMeetingRoles(meetingId)
          userIds = userIds.filter(pk => {
            return !meetingRoles.some(r => r.user.pk === pk)
          })
          if (userIds.length === 0) {
            // Nothing to fetch
            return
          }
        }
        params.user_id_in = userIds.join(',')
      }
      restApi.get('meeting-roles/', { params })
        .then(({ data }) => {
          commit('setRoles', data)
        })
    }
  },
  modules: {
  }
}
