<template>
  <div id="agenda">
    <template v-for="s in aiGroups" :key="s.state">
      <h2><icon sm :name="s.icon" /> {{ s.state }}</h2>
      <ul class="ai">
        <li v-for="ai in aiType(s.state)" :key="ai.pk"><router-link :to="aiPath(ai)">{{ ai.title }}</router-link></li>
      </ul>
    </template>
  </div>
</template>

<script>
import { computed } from 'vue'

import agendaStates from '@/schemas/agendaStates.json'

import useMeeting from '@/composables/meeting/useMeeting.js'
import useAgenda from '@/composables/meeting/useAgenda.js'

const AI_ORDER = ['ongoing', 'upcoming', 'closed', 'private']

export default {
  name: 'Agenda',
  setup () {
    const { getAgenda } = useAgenda()
    const { meetingId, meetingPath, hasRole } = useMeeting()
    const agenda = computed(_ => getAgenda(meetingId.value))
    return {
      meetingId,
      meetingPath,
      hasRole,
      agenda
    }
  },
  methods: {
    aiPath (ai) {
      return `${this.meetingPath}/a/${ai.pk}/${this.$slugify(ai.title)}`
    },
    aiType (type) {
      return this.agenda.filter(ai => ai.state === type)
    }
  },
  computed: {
    aiGroups () {
      return AI_ORDER
        .map(state => agendaStates.find(s => s.state === state))
        .filter(s => !s.requiresRole || this.hasRole(s.requiresRole))
    }
  }
}
</script>

<style lang="sass">
#agenda
  h2
    font-size: 1.2rem
    margin: .6em 0
    border-top: 1px solid #ddd
    line-height: 2
    text-transform: capitalize
    .material-icons
      color: #999
      vertical-align: text-bottom
  ul
    margin: 0
    padding: 0
    li
      margin: 0
      padding: .3rem
      font-size: 1.2rem
    a
      text-decoration: none
      padding: .4rem 1.3rem
</style>
