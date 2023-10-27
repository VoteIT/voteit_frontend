<template>
  <v-navigation-drawer
    app
    id="meeting-navigation"
    v-model="isOpen"
    width="348"
    class="d-print-none"
  >
    <MenuTree v-if="initDone" :items="menu" @navigation="toggleDrawer">
      <template #tagFilter v-if="agendaTags.length">
        <div class="d-flex ml-8 mb-1 mr-2">
          <v-btn
            class="flex-grow-1"
            variant="text"
            size="small"
            :append-icon="
              filterMenuOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'
            "
            @click="filterMenuOpen = !filterMenuOpen"
          >
            {{ t('filter') }}
          </v-btn>
          <v-btn
            variant="text"
            size="small"
            :disabled="!agendaTag"
            @click="agendaTag = undefined"
          >
            <v-icon icon="mdi-undo" />
          </v-btn>
        </div>
        <v-expand-transition>
          <v-chip-group
            column
            class="ml-8"
            v-model="agendaTag"
            :items="agendaTags"
            v-show="filterMenuOpen"
          >
            <v-chip
              v-for="tag in agendaTags"
              :key="tag"
              :value="tag"
              size="small"
            >
              {{ tag }}
            </v-chip>
          </v-chip-group>
        </v-expand-transition>
      </template>
    </MenuTree>
    <template #append>
      <ComponentSlot name="appendMenu" />
      <v-defaults-provider :defaults="{ VList: { bgColor: 'surface' } }">
        <BugReports v-if="isModerator" class="ma-2" />
      </v-defaults-provider>
    </template>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { orderBy } from 'lodash'
import { computed, ref, watch } from 'vue'
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
import useAgendaTags from '../agendas/useAgendaTags'
import { agendaItemType } from '../agendas/contentTypes'
import usePolls from '../polls/usePolls'
import useProposals from '../proposals/useProposals'
import { PollState } from '../polls/types'
import { canAddPoll } from '../polls/rules'

import useMeeting from './useMeeting'
import { canChangeMeeting } from './rules'
import { toggleNavDrawerEvent } from '@/utils/events'
import { channelSubscribedEvent } from '@/composables/events'
import ComponentSlot from './ComponentSlot.vue'

const agendaLoadedEvent = new TypedEvent()
// eslint-disable-next-line camelcase
channelSubscribedEvent.on(({ channelType }) => {
  // Agenda is loaded when "participants" or "moderators" channels are subscribed
  if (['participants', 'moderators'].includes(channelType))
    agendaLoadedEvent.emit()
})

const { t } = useI18n()
const agendaTag = ref<string | undefined>(undefined)
const { mobile } = useDisplay()
const {
  meeting,
  meetingId,
  isModerator,
  meetingRoute,
  getMeetingRoute,
  hasRole
} = useMeeting()
const { agenda, filteredAgenda, hasNewItems } = useAgenda(meetingId, agendaTag)
const { agendaTags } = useAgendaTags(agenda)
const agendaWorkflows = agendaItemType.useWorkflows()
const { getAiPolls, getUnvotedPolls } = usePolls()
const { getAgendaProposals } = useProposals()
const { initDone } = useLoader('Agenda')

function getAiType(state: string) {
  return filteredAgenda.value.filter((ai) => ai.state === state)
}

const aiGroups = computed(() =>
  agendaWorkflows.getPriorityStates(
    (s) => s && (!s.requiresRole || !!hasRole(s.requiresRole))
  )
)

function getAIMenuItems(s: WorkflowState): TreeMenuLink[] {
  return getAiType(s.state).map((ai) => ({
    title: ai.title,
    to: getMeetingRoute('agendaItem', { aid: ai.pk, aslug: slugify(ai.title) }),
    icons: getAiPolls(ai.pk, PollState.Ongoing).length
      ? ['mdi-star-outline']
      : [],
    count: getAgendaProposals(ai.pk).length || undefined,
    hasNewItems: hasNewItems(ai)
  }))
}

const aiMenus = computed<TreeMenuItem[]>(() => {
  const menus: TreeMenuItem[] = []
  if (isModerator.value) {
    menus.push({
      title: t('agenda.edit'),
      to: getMeetingRoute('agendaEdit'),
      icons: ['mdi-pencil']
    })
  }
  for (const s of aiGroups.value) {
    const items = getAIMenuItems(s)
    menus.push({
      items,
      title: s.getName(t, items.length),
      showCount: true,
      showCountTotal: agenda.value.filter((ai) => ai.state === s.state).length,
      loadedEvent: agendaLoadedEvent
    })
  }
  return menus
})

const unvotedPolls = computed(() =>
  orderBy(getUnvotedPolls(meetingId.value), ['started'])
)
const hasUnvotedPolls = computed(() => !!unvotedPolls.value.length)
const openPollMenuEvent = new TypedEvent()
watch(hasUnvotedPolls, (value, oldValue) => {
  if (value && !oldValue) openPollMenuEvent.emit()
})

const pollMenus = computed<TreeMenuItem[]>(() => {
  const menus: TreeMenuItem[] = [
    {
      exactActive: true,
      title: t('poll.all'),
      to: getMeetingRoute('polls')
    }
  ]
  if (meeting.value && canAddPoll(meeting.value)) {
    menus.push({
      title: t('poll.new'),
      to: getMeetingRoute('pollStart'),
      icons: ['mdi-star-plus']
    })
  }
  if (unvotedPolls.value.length) {
    menus.push({
      title: t('poll.unvoted'),
      items: unvotedPolls.value.map((p) => ({
        title: p.title,
        to: getMeetingRoute('poll', { pid: p.pk, pslug: slugify(p.title) }),
        icons: ['mdi-star']
      })),
      defaultOpen: true
    })
  }
  return menus
})

const menu = computed<TreeMenu[]>(() => {
  const items: TreeMenu[] = [
    {
      title: t('meeting.meeting'),
      items: [
        {
          exactActive: true,
          title: t('start'),
          to: meetingRoute.value
        },
        {
          title: t('meeting.participants'),
          to: getMeetingRoute('participants')
        },
        {
          title: t('electoralRegister.plural'),
          to: getMeetingRoute('electoralRegisters')
        },
        {
          title: t('minutes.documents'),
          to: getMeetingRoute('meetingMinutes')
        }
      ],
      icon: 'mdi-home'
    },
    {
      title: t('poll.polls'),
      items: pollMenus.value,
      icon: hasUnvotedPolls.value ? 'mdi-star' : 'mdi-star-outline',
      openEvent: openPollMenuEvent
    },
    {
      title: t('agenda.agenda'),
      items: aiMenus.value,
      defaultOpen: true,
      icon: 'mdi-format-list-bulleted',
      openFirstNonEmpty: true,
      loadedEvent: agendaLoadedEvent,
      slotBefore: 'tagFilter'
    }
  ]
  if (canChangeMeeting(meeting.value)) {
    items[0].items.push({
      icons: ['mdi-cog'],
      title: t('meeting.controlPanel'),
      to: getMeetingRoute('settings')
    })
  }
  return items
})

const isOpen = ref(!mobile.value)
function toggleDrawer() {
  if (mobile.value) isOpen.value = !isOpen.value
}
toggleNavDrawerEvent.on(toggleDrawer)

const filterMenuOpen = ref(false)
</script>

<style lang="sass">
#meeting-navigation
  background-color: rgb(var(--v-theme-app-bar))
  color: rgb(var(--v-theme-on-app-bar))

  .v-chip--selected
    background-color: rgb(var(--v-theme-app-bar-active))
    .v-chip__overlay
       opacity: 0
</style>
