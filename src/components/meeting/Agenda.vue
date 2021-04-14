<template>
  <div id="agenda">
    <MenuTree :items="menu"/>
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
import { useI18n } from 'vue-i18n'

import { slugify } from '@/utils'

import useAgenda from '@/composables/meeting/useAgenda'
import useMeeting from '@/composables/meeting/useMeeting'
import agendaItemType from '@/contentTypes/agendaItem'
import meetingRules from '@/contentTypes/meeting/rules'
import pollType from '@/contentTypes/poll'

import BtnDropdown from '../BtnDropdown.vue'
import { AgendaItem, WorkflowState } from '@/contentTypes/types'
import usePolls from '@/composables/meeting/usePolls'
import useProposals from '@/composables/meeting/useProposals'
import MenuTree from '../MenuTree.vue'

interface MenuItem {
  title: string
  to: string
  icons?: string[]
  count?: number
}

interface Menu {
  title: string
  items: (MenuItem | Menu)[]
  defaultOpen?: boolean
  showCount?: boolean
}

type MenuMix = MenuItem | Menu

export default defineComponent({
  name: 'Agenda',
  components: {
    BtnDropdown,
    MenuTree
  },
  setup () {
    const { t } = useI18n()
    const { getAgenda } = useAgenda()
    const { meeting, meetingId, meetingPath, hasRole } = useMeeting()
    const agenda = computed(() => getAgenda(meetingId.value))
    const agendaApi = agendaItemType.getContentApi()
    const agendaWorkflows = agendaItemType.useWorkflows()
    const pollWorkflows = pollType.useWorkflows()
    const { getAiPolls, getPolls } = usePolls()
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

    const aiGroups = computed<WorkflowState[]>(() => agendaWorkflows.getPriorityStates(
      s => s && (!s.requiresRole || hasRole(s.requiresRole))
    ))
    const aiMenus = computed<Menu[]>(() => {
      return aiGroups.value.map(s => ({
        title: s.state,
        showCount: true,
        items: getAIMenuItems(s),
        defaultOpen: s.state === 'ongoing'
      }))
    })
    const pollGroups = computed<WorkflowState[]>(() => {
      return pollWorkflows.getPriorityStates(
        s => !s.requiresRole || hasRole(s.requiresRole)
      )
    })
    const pollMenus = computed<MenuMix[]>(() => {
      return [{
        title: t('poll.all'),
        to: `${meetingPath.value}/polls`
      }, ...pollGroups.value.map(s => ({
        title: s.state,
        items: getPollMenuItems(s),
        showCount: true
      }))]
    })

    function getAIMenuItems (s: WorkflowState): MenuItem[] {
      return getAiType(s.state).map(ai => ({
          title: ai.title,
          to: getAiPath(ai),
          icons: getAiPolls(ai.pk, 'ongoing').length ? ['mdi-star-outline'] : [],
          count: getAgendaProposals(ai.pk).length || undefined
        })
      )
    }

    function getPollMenuItems (s: WorkflowState): MenuItem[] {
      return getPolls(meetingId.value, s.state).map(p => ({
        title: p.title,
        to: `${meetingPath.value}/polls/${p.pk}/${slugify(p.title)}`
      }))
    }

    const openMenus = reactive<Set<number>>(new Set())
    const menu = computed<Menu[]>(() => {
      const items: Menu[] = [{
        title: t('meeting.meeting'),
        items: [{
          title: t('start'),
          to: meetingPath.value
        }, {
          title: t('meeting.participants'),
          to: `${meetingPath.value}/participants`
        }]
      },
      {
        title: t('poll.polls'),
        items: pollMenus.value
      },
      {
        title: t('meeting.agenda'),
        items: aiMenus.value,
        defaultOpen: true
      }]
      if (meetingRules.canChange(meeting.value)) {
        items[0].items.push({
          title: t('settings'),
          to: `${meetingPath.value}/settings`
        })
      }
      return items
    })
    function toggleMenu (index: number) {
      if (openMenus.has(index)) return openMenus.delete(index)
      openMenus.add(index)
    }

    return {
      t,
      meeting,
      openMenus,
      menu,
      toggleMenu,
      getAiPath,
      getAiType,
      aiGroups,
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
  background-color: rgb(var(--v-theme-app-bar))
  color: rgb(var(--v-theme-on-app-bar))

  .agenda-add-form
    display: flex
    input[type=text]
      flex: 1 1 auto
      min-width: 0
      background-color: rgb(var(--v-theme-background))
      padding: 0 .4em
      border-radius: 3px 0 0 3px
    .v-btn
      border-radius: 0 3px 3px 0

  .btn-dropdown
    margin: 1rem .5rem
</style>
