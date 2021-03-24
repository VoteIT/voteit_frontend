<template>
  <div id="agenda">
    <h2>{{ t('agenda.agenda') }}</h2>
    <div v-for="s in aiGroups" :key="s.state" class="ai-state" :class="{ open: openStates.has(s.state) }">
      <v-btn plain block @click="toggleState(s)">{{ s.state }} <v-icon right icon="mdi-chevron-right"/></v-btn>
      <ul class="ai" v-if="openStates.has(s.state)">
        <li v-for="ai in getAiType(s.state)" :key="ai.pk">
          <RouterLink :to="getAiPath(ai)">
            <span>{{ ai.title }}</span>
            <div class="meta">
              <v-icon v-if="getAiPolls(ai.pk, 'ongoing').length" size="x-small" icon="mdi-star-outline"/>
              <small>{{ getAgendaProposals(ai.pk).length || '' }}</small>
            </div>
          </RouterLink>
        </li>
      </ul>
    </div>
    <BtnDropdown dark title="New agenda item" @open="focusInput" v-if="canAdd(meeting)">
      <form @submit.prevent="addAgendaItem" class="agenda-add-form">
        <input ref="inputEl" type="text" required v-model="newAgendaTitle" @keyup.ctrl.enter="addAgendaItem" />
        <v-btn :disabled="!newAgendaTitle" size="small" @click="addAgendaItem">{{ t('add') }}</v-btn>
      </form>
    </BtnDropdown>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref } from 'vue'

import useAgenda from '@/composables/meeting/useAgenda'
import useMeeting from '@/composables/meeting/useMeeting'
import agendaItemType from '@/contentTypes/agendaItem'

import BtnDropdown from '../BtnDropdown.vue'
import { slugify } from '@/utils'
import { AgendaItem, WorkflowState } from '@/contentTypes/types'
import usePolls from '@/composables/meeting/usePolls'
import useProposals from '@/composables/meeting/useProposals'

const AI_ORDER = ['ongoing', 'upcoming', 'closed', 'private']

export default defineComponent({
  name: 'Agenda',
  inject: ['t'],
  components: {
    BtnDropdown
  },
  setup () {
    const { getAgenda } = useAgenda()
    const { meeting, meetingId, meetingPath, hasRole } = useMeeting()
    const agenda = computed(() => getAgenda(meetingId.value))
    const agendaApi = agendaItemType.getContentApi()
    const { getState } = agendaItemType.useWorkflows()
    const openStates = reactive(new Set(['ongoing']))
    const { getAiPolls } = usePolls()
    const { getAgendaProposals } = useProposals()

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

    function toggleState (state: WorkflowState) {
      if (openStates.has(state.state)) {
        return openStates.delete(state.state)
      }
      openStates.add(state.state)
    }

    return {
      meeting,
      getAiPath,
      getAiType,
      aiGroups,
      openStates,
      toggleState,
      getAiPolls,
      getAgendaProposals,
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
    margin-bottom: 1em
  .ai-state
    border-top: 1px solid rgb(var(--v-theme-divider))
    padding: .5em 0 .5em
    &.open button .mdi
      transform: rotate(90deg)
    button
      font-size: 10pt
      font-weight: normal
      color: #000
      justify-content: left
      color: rgb(var(--v-theme-on-background))
      padding-left: .2em
      opacity: 1
      &:first-child
        border-top: none
      line-height: 2
      .mdi
        transition: transform .2s
  ul
    margin: 0 0 .5em
    padding: 0
    li
      margin: 0
      font-size: 1.2rem
      list-style: none
    a
      display: flex
      justify-content: space-between
      text-decoration: none
      font-size: 12pt
      padding: .4rem .4rem .4rem 1.2em
      color: rgb(var(--v-theme-on-background))
      position: relative
      .mdi
        vertical-align: -1px
      small
        margin-left: .4em
      &.router-link-active
        background-color: rgb(var(--v-theme-surface))
        border-radius: 5px
        &::before
          content: '•'
          position: absolute
          left: .25em
          top: 2px
          font-size: 16pt
          color: rgb(var(--v-theme-menu-active))

  .agenda-add-form
    display: flex
    input[type=text]
      flex: 1 1 auto
      min-width: 0
      background-color: var(--bg)
      padding: 0 .4em
      border-radius: 3px 0 0 3px
    .v-btn
      border-radius: 0 3px 3px 0

  .btn-dropdown
    margin: 1rem .5rem
</style>
