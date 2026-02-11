<script setup lang="ts">
import { computed, shallowReactive, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { slugify } from '@/utils'
import { TreeMenuLink } from '@/utils/types'
import CollapsibleMenu from '@/components/CollapsibleMenu.vue'
import { WorkflowState } from '@/contentTypes/types'
import { AgendaState } from '@/modules/agendas/types'
import { agendaItemType } from '@/modules/agendas/contentTypes'
import { agendaLoadedEvent } from '@/modules/agendas/events'
import useAgendaTags from '@/modules/agendas/useAgendaTags'
import useAgenda from '@/modules/agendas/useAgenda'
import useAgendaStore from '@/modules/agendas/useAgendaStore'
import usePolls from '@/modules/polls/usePolls'
import { PollState } from '@/modules/polls/types'
import useProposals from '@/modules/proposals/useProposals'
import useMeeting from '../useMeeting'

const { t } = useI18n()
const route = useRoute()
const { meetingId, isModerator, getMeetingRoute, hasRole } = useMeeting()
const { getAgendaItem, hasNewContent } = useAgendaStore()
const { agenda, filteredAgenda } = useAgenda(
  meetingId,
  computed(() => selectedAgendaTag.value) // Cirkular
)
const agendaWorkflows = agendaItemType.useWorkflows()
const { agendaTags, selectedAgendaTag } = useAgendaTags(agenda)
const { getAiPolls } = usePolls()
const { getAgendaProposals } = useProposals()

function getAiType(state: string) {
  return filteredAgenda.value.filter((ai) => ai.state === state)
}

const aiGroups = computed(() =>
  agendaWorkflows.getPriorityStates(
    (s) => !s.requiresRole || !!hasRole(s.requiresRole)
  )
)

/**
 * Get menu items for a given agenda state
 */
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

const agendaLinks = computed(() =>
  isModerator.value
    ? [
        {
          title: t('agenda.edit'),
          to: getMeetingRoute('agendaEdit'),
          icons: ['mdi-pencil']
        }
      ]
    : []
)

const initialAiState =
  route.name === 'agendaItem'
    ? getAgendaItem(Number(route.params.aid))?.state
    : undefined
const MENU_STATES = [
  AgendaState.Closed,
  AgendaState.Ongoing,
  AgendaState.Private,
  AgendaState.Upcoming
] as const

const openMenus = shallowReactive(
  Object.fromEntries(MENU_STATES.map((s) => [s, s === initialAiState]))
)

const AgendaMenus = computed(() =>
  aiGroups.value.map((s) => {
    const items = getAIMenuItems(s)
    const count = selectedAgendaTag.value
      ? `${items.length}/${
          agenda.value.filter((ai) => ai.state === s.state).length
        }`
      : items.length.toString()
    return {
      count,
      items,
      state: s.state,
      title: s.getName(t, items.length)
    }
  })
)

/**
 * Open first non-empty agenda state
 */
agendaLoadedEvent.on(() => {
  const openState =
    (route.name === 'agendaItem'
      ? getAgendaItem(Number(route.params.aid))?.state
      : undefined) ??
    aiGroups.value.find((s) => getAIMenuItems(s).length)?.state
  if (openState) openMenus[openState] = true
})

const filterMenuOpen = shallowRef(false)
const isOpen = shallowRef(true)
</script>

<template>
  <li>
    <CollapsibleMenu
      auto-open
      icon="mdi-format-list-bulleted"
      :links="agendaLinks"
      :title="$t('agenda.agenda')"
      v-model="isOpen"
    >
      <template #prepend v-if="agendaTags.length">
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
          <div v-show="filterMenuOpen">
            <v-chip-group
              column
              class="mt-n2 ml-8"
              v-model="selectedAgendaTag"
              :items="agendaTags"
            >
              <v-chip
                v-for="tag in agendaTags"
                :key="tag"
                size="small"
                :text="tag"
                :value="tag"
              />
            </v-chip-group>
          </div>
        </v-expand-transition>
      </template>
      <template #append>
        <CollapsibleMenu
          v-for="menu in AgendaMenus"
          :links="menu.items"
          :title="menu.title"
          :modelValue="openMenus[menu.state]"
          @activated="isOpen = true"
        >
          <template #appendTitle> ({{ menu.count }}) </template>
        </CollapsibleMenu>
      </template>
    </CollapsibleMenu>
  </li>
</template>
