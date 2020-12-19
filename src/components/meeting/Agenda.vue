<template>
  <div id="agenda">
    <template v-for="s in aiGroups" :key="s.state">
      <h2><icon sm :name="s.icon" /> {{ s.state }}</h2>
      <ul class="ai">
        <li v-for="ai in aiType(s.state)" :key="ai.pk"><router-link :to="aiPath(ai)">{{ ai.title }}</router-link></li>
      </ul>
    </template>
    <btn-dropdown title="New agenda item" @open="focusInput">
      <form @submit.prevent="addAgendaItem">
        <input ref="inputEl" type="text" required v-model="newAgendaTitle" @keyup.ctrl.enter="addAgendaItem" />
        <input class="btn" type="submit" value="Add"/>
      </form>
    </btn-dropdown>
  </div>
</template>

<script>
import { computed, ref } from 'vue'

import agendaStates from '@/schemas/agendaStates.json'

import useMeeting from '@/composables/meeting/useMeeting.js'
import useAgenda from '@/composables/meeting/useAgenda.js'
import useContentApi from '../../composables/useContentApi'
import BtnDropdown from '../BtnDropdown.vue'

const AI_ORDER = ['ongoing', 'upcoming', 'closed', 'private']

export default {
  components: { BtnDropdown },
  name: 'Agenda',
  setup () {
    const { getAgenda } = useAgenda()
    const { meetingId, meetingPath, hasRole } = useMeeting()
    const agenda = computed(_ => getAgenda(meetingId.value))
    const agendaApi = useContentApi('agenda_item')

    // Add AgendaItem
    const newAgendaTitle = ref('')
    function addAgendaItem () {
      agendaApi.add({
        meeting: meetingId.value,
        title: newAgendaTitle.value
      })
        .then(_ => { newAgendaTitle.value = '' })
    }
    // Focus input element
    const inputEl = ref(null)
    function focusInput () {
      inputEl.value.focus()
    }

    return {
      meetingId,
      meetingPath,
      hasRole,
      agenda,

      newAgendaTitle,
      addAgendaItem,
      inputEl,
      focusInput
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
      display: block
      text-decoration: none
      padding: .4rem 1.3rem
      color: #000
      position: relative
      &.router-link-active
        color: #228
        &::after
          content: '❧'
          position: absolute
          left: -3px
          top: .35em
          color: #bbc
</style>
