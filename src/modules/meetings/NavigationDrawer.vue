<script lang="ts" setup>
import { sortBy } from 'lodash'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { slugify } from '@/utils'
import { toggleNavDrawerEvent } from '@/utils/events'
import { TreeMenu, TreeMenuItem, TreeMenuLink } from '@/utils/types'
import TypedEvent from '@/utils/TypedEvent'
import MenuTree from '@/components/MenuTree.vue'
import useLoader from '@/composables/useLoader'
import { WorkflowState } from '@/contentTypes/types'

import { agendaLoadedEvent } from '../agendas/events'
import useAgenda from '../agendas/useAgenda'
import useAgendaStore from '../agendas/useAgendaStore'
import useAgendaTags from '../agendas/useAgendaTags'
import { agendaItemType } from '../agendas/contentTypes'
import usePolls from '../polls/usePolls'
import { PollState } from '../polls/types'
import { canAddPoll } from '../polls/rules'
import useProposals from '../proposals/useProposals'

import useMeeting from './useMeeting'
import { canChangeMeeting, hasMeetingRole } from './rules'
import ComponentSlot from './ComponentSlot.vue'

const { t } = useI18n()
const { mobile } = useDisplay()
const { meeting, meetingId, isModerator, meetingRoute, getMeetingRoute } =
  useMeeting()
const { agenda, filteredAgenda } = useAgenda(
  meetingId,
  computed(() => selectedAgendaTag.value)
)
const { hasNewContent } = useAgendaStore()
const { agendaTags, selectedAgendaTag } = useAgendaTags(agenda)
const agendaWorkflows = agendaItemType.useWorkflows()
const { getAiPolls, getUnvotedPolls } = usePolls()
const { getAgendaProposals } = useProposals()
const { initDone } = useLoader('Agenda')

function getAiType(state: string) {
  return filteredAgenda.value.filter((ai) => ai.state === state)
}

const aiGroups = computed(() =>
  agendaWorkflows.getPriorityStates(
    (s) => !s.requiresRole || !!hasMeetingRole(meetingId.value, s.requiresRole)
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
    hasNewItems: hasNewContent(ai)
  }))
}

const aiMenus = computed<TreeMenuItem[]>(() => {
  function* iterMenus(): Iterable<TreeMenuItem> {
    if (isModerator.value) {
      yield {
        title: t('agenda.edit'),
        to: getMeetingRoute('agendaEdit'),
        icons: ['mdi-pencil']
      }
    }
    for (const s of aiGroups.value) {
      const items = getAIMenuItems(s)
      yield {
        items,
        title: s.getName(t, items.length),
        showCount: true,
        showCountTotal: agenda.value.filter((ai) => ai.state === s.state)
          .length,
        loadedEvent: agendaLoadedEvent
      }
    }
  }
  return [...iterMenus()]
})

const unvotedPolls = computed(() =>
  sortBy(getUnvotedPolls(meetingId.value), 'started')
)
const hasUnvotedPolls = computed(() => !!unvotedPolls.value.length)
const openPollMenuEvent = new TypedEvent()
watch(hasUnvotedPolls, (value, oldValue) => {
  if (value && !oldValue) openPollMenuEvent.emit()
})

const pollMenus = computed(() => {
  function* iterMenus(): Iterable<TreeMenuItem> {
    yield {
      exactActive: true,
      title: t('poll.all'),
      to: getMeetingRoute('polls')
    }
    if (meeting.value && canAddPoll(meeting.value))
      yield {
        title: t('poll.new'),
        to: getMeetingRoute('pollStart'),
        icons: ['mdi-star-plus']
      }
    if (unvotedPolls.value.length)
      yield {
        title: t('poll.unvoted'),
        items: unvotedPolls.value.map((p) => ({
          title: p.title,
          to: getMeetingRoute('poll', { pid: p.pk, pslug: slugify(p.title) }),
          icons: ['mdi-star']
        })),
        defaultOpen: true
      }
  }
  return [...iterMenus()]
})

const menu = computed(() => {
  function* iterMeetingItems(): Iterable<TreeMenuItem> {
    if (canChangeMeeting(meeting.value)) {
      yield {
        icons: ['mdi-cog'],
        title: t('meeting.controlPanel'),
        to: getMeetingRoute('settings')
      }
    }
  }
  return [
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
        },
        ...iterMeetingItems()
      ],
      icon: 'mdi-home'
    },
    {
      title: t('poll.poll', 2),
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
  ] as TreeMenu[]
})

const isOpen = ref(!mobile.value)
function toggleDrawer() {
  if (mobile.value) isOpen.value = !isOpen.value
}
toggleNavDrawerEvent.on(toggleDrawer)

const filterMenuOpen = ref(false)
</script>

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
            :append-icon="
              filterMenuOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'
            "
            class="flex-grow-1"
            size="small"
            :text="$t('filter')"
            variant="text"
            @click="filterMenuOpen = !filterMenuOpen"
          />
          <v-btn
            variant="text"
            size="small"
            :disabled="!selectedAgendaTag"
            @click="selectedAgendaTag = undefined"
          >
            <v-icon icon="mdi-undo" />
          </v-btn>
        </div>
        <v-expand-transition>
          <v-chip-group
            column
            class="ml-8"
            v-model="selectedAgendaTag"
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
    </template>
  </v-navigation-drawer>
</template>

<style lang="sass">
#meeting-navigation
  background-color: rgb(var(--v-theme-app-bar))
  color: rgb(var(--v-theme-on-app-bar))

  .v-chip--selected
    background-color: rgb(var(--v-theme-app-bar-active))
    .v-chip__overlay
       opacity: 0
</style>
