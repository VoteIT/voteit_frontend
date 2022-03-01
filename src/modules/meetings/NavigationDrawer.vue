<template>
  <v-navigation-drawer v-if="initDone" app id="meeting-navigation" v-model="isOpen" width="348">
    <MenuTree :items="menu" @navigation="toggleDrawer" />
    <template #append>
      <BugReports class="ma-2" />
    </template>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { slugify } from '@/utils'
import { TreeMenu, TreeMenuItem, TreeMenuLink } from '@/utils/types'
import TypedEvent from '@/utils/TypedEvent'
import MenuTree from '@/components/MenuTree.vue'
import BugReports from '@/modules/bugReports/BugReports.vue'
import useLoader from '@/composables/useLoader'
import { WorkflowState } from '@/contentTypes/types'

import useAgenda from '../agendas/useAgenda'
import { agendaItemType } from '../agendas/contentTypes'
import useMeeting from '../meetings/useMeeting'
import usePolls from '../polls/usePolls'
import useProposals from '../proposals/useProposals'
import { PollState } from '../polls/types'
import { AgendaItem } from '../agendas/types'
import { canAddPoll } from '../polls/rules'

import { canChangeMeeting } from './rules'
import { toggleNavDrawerEvent } from '@/utils/events'
import { orderBy } from 'lodash'
import { channelSubscribedEvent } from '@/composables/events'

const agendaLoadedEvent = new TypedEvent()
channelSubscribedEvent.on(uri => {
  const channelName = uri.split('/')[0]
  // Agenda is loaded when "participants" or "moderators" channels are subscribed
  if (['participants', 'moderators'].includes(channelName)) agendaLoadedEvent.emit()
})

export default defineComponent({
  name: 'Agenda',
  components: {
    MenuTree,
    BugReports
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
      s => s && (!s.requiresRole || !!hasRole(s.requiresRole))
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
          title: t(`workflowState.plural.${s.state}`),
          showCount: true,
          items: getAIMenuItems(s),
          loadedEvent: agendaLoadedEvent
        })
      }
      return menus
    })

    const unvotedPolls = computed(() => orderBy(getUnvotedPolls(meetingId.value), ['started']))
    const hasUnvotedPolls = computed(() => !!unvotedPolls.value.length)
    const openPollMenuEvent = new TypedEvent()
    watch(hasUnvotedPolls, (value, oldValue) => {
      if (value && !oldValue) openPollMenuEvent.emit()
    })

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
          })),
          defaultOpen: true
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
        }, {
          title: t('electoralRegister.plural'),
          to: `${meetingPath.value}/er`
        }],
        icon: 'mdi-home-variant-outline'
      },
      {
        title: t('poll.polls'),
        items: pollMenus.value,
        icon: hasUnvotedPolls.value ? 'mdi-star' : 'mdi-star-outline',
        openEvent: openPollMenuEvent
      },
      {
        title: t('meeting.agenda'),
        items: aiMenus.value,
        defaultOpen: true,
        icon: 'mdi-format-list-bulleted',
        openFirstNonEmpty: true,
        loadedEvent: agendaLoadedEvent
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
