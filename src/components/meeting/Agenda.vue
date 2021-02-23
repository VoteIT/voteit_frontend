<template>
  <div id="agenda">
    <template v-for="s in aiGroups" :key="s.state">
      <h2><icon sm :name="s.icon" /> {{ s.state }}</h2>
      <ul class="ai">
        <li v-for="ai in getAiType(s.state)" :key="ai.pk"><router-link :to="getAiPath(ai)">{{ ai.title }}</router-link></li>
      </ul>
    </template>
    <btn-dropdown dark title="New agenda item" @open="focusInput" v-if="canAdd(meeting)">
      <form @submit.prevent="addAgendaItem" class="agenda-add-form">
        <input ref="inputEl" type="text" required v-model="newAgendaTitle" @keyup.ctrl.enter="addAgendaItem" />
        <input class="btn" type="submit" value="Add"/>
      </form>
    </btn-dropdown>
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
    const agendaApi = agendaItemType.useContentApi()
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
      inputEl.value && inputEl.value.focus()
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

  .agenda-add-form
    display: flex
    input:first-child
      flex: 1 0 auto
    input[type="submit"]
      background-color: #eee
      border-radius: 0 3px 3px 0
      border: 1px solid #666
      border-left: 0
</style>
