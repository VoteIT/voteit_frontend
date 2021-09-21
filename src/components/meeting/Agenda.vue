<template>
  <v-navigation-drawer v-if="initDone" app id="agenda" v-model="isOpen" width="348">
    <MenuTree :items="menu" @navigation="toggleDrawer" />
  </v-navigation-drawer>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { slugify, toggleNavDrawerEvent } from '@/utils'

import useLoader from '@/composables/useLoader'
import useAgenda from '@/modules/agendas/useAgenda'
import useMeeting from '@/modules/meetings/useMeeting'
import agendaItemType from '@/contentTypes/agendaItem'
import meetingRules from '@/contentTypes/meeting/rules'
import pollType from '@/contentTypes/poll'

import { AgendaItem, WorkflowState } from '@/contentTypes/types'
import usePolls from '@/composables/meeting/usePolls'
import useProposals from '@/composables/meeting/useProposals'
import MenuTree from '../MenuTree.vue'
import { TreeMenu, TreeMenuItem, TreeMenuLink } from '@/utils/types'

export default defineComponent({
  name: 'Agenda',
  components: {
    MenuTree
  },
  setup () {
    const { t } = useI18n()
    const { getAgenda, hasNewItems } = useAgenda()
    const { meeting, meetingId, meetingPath, hasRole } = useMeeting()
    const agenda = computed(() => getAgenda(meetingId.value))
    const agendaWorkflows = agendaItemType.useWorkflows()
    const pollWorkflows = pollType.useWorkflows()
    const { getAiPolls, getPolls } = usePolls()
    const { getAgendaProposals } = useProposals()
    const { initDone } = useLoader('Agenda')

    function getAiPath (ai: AgendaItem) {
      return `${meetingPath.value}/a/${ai.pk}/${slugify(ai.title)}`
    }

    function getAiType (state: string) {
      return agenda.value.filter(ai => ai.state === state)
    }

    const aiGroups = computed<WorkflowState[]>(() => agendaWorkflows.getPriorityStates(
      s => s && (!s.requiresRole || hasRole(s.requiresRole))
    ))

    const aiMenus = computed<TreeMenuItem[]>(() => {
      const menus: TreeMenuItem[] = []
      if (agendaItemType.rules.canChange(meeting.value)) {
        menus.push({
          title: t('agenda.edit'),
          to: meetingPath.value + '/settings/agenda',
          icons: ['mdi-pencil']
        })
      }
      for (const s of aiGroups.value) {
        menus.push({
          title: s.state,
          showCount: true,
          items: getAIMenuItems(s)
        })
      }
      return menus
    })
    const pollGroups = computed<WorkflowState[]>(() => {
      return pollWorkflows.getPriorityStates(
        s => !s.requiresRole || hasRole(s.requiresRole)
      )
    })
    const pollMenus = computed<TreeMenuItem[]>(() => {
      const menus: TreeMenuLink[] = [{
        title: t('poll.all'),
        to: `${meetingPath.value}/polls`
      }]
      if (pollType.rules.canAdd(meeting.value)) {
        menus.push({
          title: t('poll.new'),
          to: `${meetingPath.value}/polls/new`,
          icons: ['mdi-star']
        })
      }
      const groups: TreeMenu[] = pollGroups.value.map(s => ({
        title: s.state,
        items: getPollMenuItems(s),
        showCount: true
      }))
      return [...menus, ...groups]
    })

    function getAIMenuItems (s: WorkflowState): TreeMenuLink[] {
      return getAiType(s.state).map(ai => ({
          title: ai.title,
          to: getAiPath(ai),
          icons: getAiPolls(ai.pk, 'ongoing').length ? ['mdi-star-outline'] : [],
          count: getAgendaProposals(ai.pk).length || undefined,
          hasNewItems: hasNewItems(ai)
        })
      )
    }

    function getPollMenuItems (s: WorkflowState): TreeMenuLink[] {
      return getPolls(meetingId.value, s.state).map(p => ({
        title: p.title,
        to: `${meetingPath.value}/polls/${p.pk}/${slugify(p.title)}`
      }))
    }

    const menu = computed<TreeMenu[]>(() => {
      const items: TreeMenu[] = [{
        title: t('meeting.meeting'),
        items: [{
          title: t('start'),
          to: meetingPath.value
        }, {
          title: t('meeting.participants'),
          to: `${meetingPath.value}/participants`
        }],
        icon: 'mdi-home-variant-outline'
      },
      {
        title: t('poll.polls'),
        items: pollMenus.value,
        icon: 'mdi-star-outline',
        openFirstNonEmpty: true
      },
      {
        title: t('meeting.agenda'),
        items: aiMenus.value,
        defaultOpen: true,
        icon: 'mdi-format-list-bulleted',
        openFirstNonEmpty: true
      }]
      if (meetingRules.canChange(meeting.value)) {
        items[0].items.push({
          title: t('settings'),
          to: `${meetingPath.value}/settings`
        })
        items[2].items.unshift({
          title: t('agenda.edit'),
          to: `${meetingPath.value}/settings/agenda`
        })
      }
      return items
    })

    const isOpen = ref(window.innerWidth >= 1280)
    function toggleDrawer () {
      if (window.innerWidth < 1280) isOpen.value = !isOpen.value
    }
    toggleNavDrawerEvent.on(toggleDrawer)

    return {
      t,
      isOpen,
      initDone,
      toggleDrawer,
      meeting,
      menu,
      getAiPath,
      getAiType,
      aiGroups,
      getAiPolls,
      getAgendaProposals
    }
  }
})
</script>

<style lang="sass">
#agenda
  background-color: rgb(var(--v-theme-app-bar))
  color: rgb(var(--v-theme-on-app-bar))
</style>
