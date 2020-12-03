import { restApi } from '@/utils'

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
    meetings: {},
    meetingList: [], // Sorted pk list
    agendas: {},
    meetingRoles: []
  },
  getters: {
    orderedMeetings (state) {
      return state.meetingList.map(id => state.meetings[id])
    },
    getMeetingRoles: state => meetingId => {
      return state.meetingRoles.filter(r => r.meeting === meetingId)
    },
    getRoles: state => (userId, meetingId) => {
      return state.meetingRoles.find(r => r.user.pk === userId && r.meeting === meetingId) || { user: {}, assigned: [] }
    },
    getUser: state => (userId, meetingId) => {
      const role = state.meetingRoles.find(r => r.user.pk === userId && r.meeting === meetingId)
      if (role) {
        return role.user
      }
      return {}
    },
    getMeeting: state => meetingId => {
      return state.meetings[meetingId] || {}
    }
  },
  mutations: {
    setRoles (state, roles) {
      // Update current value or push new
      roles.forEach(role => {
        const currentIndex = state.meetingRoles.findIndex(r => r.pk === role.pk)
        if (currentIndex === -1) {
          state.meetingRoles.push(role)
        } else {
          state.meetingRoles[currentIndex] = role
        }
      })
    },
    setMeetings (state, meetings) {
      state.meetingList = meetings.map(m => m.pk)
      meetings.forEach(m => {
        state.meetings[m.pk] = m
      })
    },
    updateMeeting (state, meeting) {
      state.meetings[meeting.pk] = meeting
      if (meeting.agenda_items) {
        sortAgenda(meeting.agenda_items)
        state.agendas[meeting.pk] = meeting.agenda_items
      }
    },
    updateAgenda (state, { t, p }) {
      const item = p.item || p // Can be only a pk
      const agenda = state.agendas[item.meeting] || []
      const index = agenda.findIndex(ai => ai.pk === item.pk)
      switch (t) {
        case 'agenda.added':
        case 'agenda.changed':
          if (!(item.meeting in state.agendas)) {
            state.agendas[item.meeting] = []
          }
          if (index === -1) {
            agenda.push(item)
          } else {
            agenda[index] = item
          }
          sortAgenda(agenda)
          break
        case 'agenda.deleted':
          // Probably rewrite using other structure
          Object.values(state.agendas)
            .forEach(agenda => {
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
    fetchMeetingRoles ({ commit, state }, { meetingId, userIds }) {
      const params = { context: meetingId }
      if (userIds) {
        userIds = [...new Set(userIds)]
        if (!FORCE_ROLES_FETCH) {
          // Skip userid's already in store
          userIds = userIds.filter(pk => !state.meetingRoles.some(r => r.meeting === meetingId && r.user.pk === pk))
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
