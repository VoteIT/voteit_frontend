<template>
  <v-navigation-drawer v-if="initDone" app id="meeting-navigation" v-model="isOpen" width="348">
    <MenuTree :items="menu" @navigation="toggleDrawer" />
  </v-navigation-drawer>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify/composables'

import { slugify, toggleNavDrawerEvent } from '@/utils'

import useLoader from '@/composables/useLoader'
import useAgenda from '@/modules/agendas/useAgenda'
import useMeeting from '@/modules/meetings/useMeeting'
import { agendaItemType } from '../agendas/contentTypes'
// import { pollType } from '../polls/contentTypes'

import { WorkflowState } from '@/contentTypes/types'
import usePolls from '@/modules/polls/usePolls'
import useProposals from '@/modules/proposals/useProposals'
import MenuTree from '@/components/MenuTree.vue'
import { TreeMenu, TreeMenuItem, TreeMenuLink } from '@/utils/types'
import { PollState } from '../polls/types'
import { AgendaItem } from '../agendas/types'
import { canAddPoll } from '../polls/rules'
import { canChangeMeeting } from './rules'

export default defineComponent({
  name: 'Agenda',
  components: {
    MenuTree
  },
  setup () {
    const { t } = useI18n()
    const { mobile } = useDisplay()
    const { getAgenda, hasNewItems } = useAgenda()
    const { meeting, meetingId, meetingPath, hasRole, isModerator } = useMeeting()
    const agenda = computed(() => getAgenda(meetingId.value))
    const agendaWorkflows = agendaItemType.useWorkflows()
    // const pollWorkflows = pollType.useWorkflows()
    const { getAiPolls, getUnvotedPolls } = usePolls()
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
      if (isModerator.value) {
        menus.push({
          title: t('agenda.edit'),
          to: meetingPath.value + '/settings/agenda',
          icons: ['mdi-pencil']
        })
      }
      for (const s of aiGroups.value) {
        menus.push({
          title: t(`workflowState.${s.state}`),
          showCount: true,
          items: getAIMenuItems(s)
        })
      }
      return menus
    })

    const unvotedPolls = computed(() => getUnvotedPolls(meetingId.value))

    const pollMenus = computed<TreeMenuItem[]>(() => {
      const menus: TreeMenuItem[] = [{
        title: t('poll.all'),
        to: `${meetingPath.value}/polls`
      }]
      if (meeting.value && canAddPoll(meeting.value)) {
        menus.push({
          title: t('poll.new'),
          to: `${meetingPath.value}/polls/new`,
          icons: ['mdi-star-plus']
        })
      }
      if (unvotedPolls.value.length) {
        menus.push({
          title: t('poll.unvoted'),
          items: unvotedPolls.value.map(p => ({
            title: p.title,
            to: `${meetingPath.value}/polls/${p.pk}/${slugify(p.title)}`,
            icons: ['mdi-star']
          }))
        })
      }
      return menus
    })

    function getAIMenuItems (s: WorkflowState): TreeMenuLink[] {
      return getAiType(s.state).map(ai => ({
          title: ai.title,
          to: getAiPath(ai),
          icons: getAiPolls(ai.pk, PollState.Ongoing).length ? ['mdi-star-outline'] : [],
          count: getAgendaProposals(ai.pk).length || undefined,
          hasNewItems: hasNewItems(ai)
        })
      )
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
        icon: unvotedPolls.value.length ? 'mdi-star' : 'mdi-star-outline',
        openFirstNonEmpty: true
      },
      {
        title: t('meeting.agenda'),
        items: aiMenus.value,
        defaultOpen: true,
        icon: 'mdi-format-list-bulleted',
        openFirstNonEmpty: true
      }]
      if (canChangeMeeting(meeting.value)) {
        items[0].items.push({
          title: t('settings'),
          to: `${meetingPath.value}/settings`
        })
      }
      return items
    })

    const isOpen = ref(!mobile.value)
    function toggleDrawer () {
      if (mobile.value) isOpen.value = !isOpen.value
    }
    toggleNavDrawerEvent.on(toggleDrawer)

    return {
      isOpen,
      initDone,
      menu,
      toggleDrawer
    }
  }
})
</script>

<style lang="sass">
#meeting-navigation
  background-color: rgb(var(--v-theme-app-bar))
  color: rgb(var(--v-theme-on-app-bar))
</style>
