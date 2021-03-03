<template>
  <div id="agenda">
    <template v-for="s in aiGroups" :key="s.state">
      <h2><Icon sm :name="s.icon" /> {{ s.state }}</h2>
      <ul class="ai">
        <li v-for="ai in getAiType(s.state)" :key="ai.pk"><RouterLink :to="getAiPath(ai)">{{ ai.title }}</RouterLink></li>
      </ul>
    </template>
    <BtnDropdown dark title="New agenda item" @open="focusInput" v-if="canAdd(meeting)">
      <form @submit.prevent="addAgendaItem" class="agenda-add-form">
        <input ref="inputEl" type="text" required v-model="newAgendaTitle" @keyup.ctrl.enter="addAgendaItem" />
        <input class="btn" type="submit" value="Add"/>
      </form>
    </BtnDropdown>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'

import useAgenda from '@/composables/meeting/useAgenda'
import useMeeting from '@/composables/meeting/useMeeting'
import agendaItemType from '@/contentTypes/agendaItem'

import BtnDropdown from '../BtnDropdown.vue'
import { slugify } from '@/utils'
import { AgendaItem } from '@/contentTypes/types'

const AI_ORDER = ['ongoing', 'upcoming', 'closed', 'private']

export default defineComponent({
  name: 'Agenda',
  components: {
    BtnDropdown
  },
  setup () {
    const { getAgenda } = useAgenda()
    const { meeting, meetingId, meetingPath, hasRole } = useMeeting()
    const agenda = computed(() => getAgenda(meetingId.value))
    const agendaApi = agendaItemType.getContentApi()
    const { getState } = agendaItemType.useWorkflows()

    // Add AgendaItem
    const newAgendaTitle = ref('')
    function addAgendaItem () {
      agendaApi.add({
        meeting: meetingId.value,
        title: newAgendaTitle.value
      })
        .then(() => { newAgendaTitle.value = '' })
    }
    // Focus input element
    const inputEl = ref<HTMLElement | null>(null)
    function focusInput () {
      // eslint-disable-next-line no-unused-expressions
      inputEl.value?.focus()
    }

    function getAiPath (ai: AgendaItem) {
      return `${meetingPath.value}/a/${ai.pk}/${slugify(ai.title)}`
    }

    function getAiType (state: string) {
      return agenda.value.filter(ai => ai.state === state)
    }

    const aiGroups = computed(() => {
      return AI_ORDER
        .map(getState)
        .filter(s => s && (!s.requiresRole || hasRole(s.requiresRole)))
    })

    return {
      meeting,
      getAiPath,
      getAiType,
      aiGroups,
      ...agendaItemType.rules,

      newAgendaTitle,
      addAgendaItem,
      inputEl,
      focusInput
    }
  }
})
</script>

<style lang="sass">
#agenda
  h2
    font-size: 1.2rem
    margin: 0 0 .3em
    padding-top: .3em
    border-top: var(--agenda-separator)
    &:first-child
      border-top: none
    line-height: 2
    text-transform: capitalize
    .material-icons
      color: var(--discrete-icon)
      vertical-align: -2px
      margin-left: .2rem
  ul
    margin: 0
    padding: 0
    li
      margin: 0
      font-size: 1.2rem
    a
      display: block
      text-decoration: none
      padding: .4rem .2rem .4rem 1.6rem
      color: var(--agenda-link)
      position: relative
      &.router-link-active
        background-color: var(--agenda-link-active-bg)
        color: var(--agenda-link-active)
        &::after
          content: '❧'
          position: absolute
          left: 3px
          top: .25em
          color: var(--discrete-icon)

  .agenda-add-form
    display: flex
    input[type=text]
      flex: 1 1 auto
      min-width: 0
    input[type="submit"]
      background-color: var(--btn-active-bg)
      color: var(--btn-active-text)
      border-radius: 0 3px 3px 0
      border: 0
      border-left: 0

  .btn-dropdown
    margin: 1rem .5rem
</style>
