<script lang="ts" setup>
import {
  ComponentPublicInstance,
  computed,
  nextTick,
  provide,
  shallowRef,
  watch
} from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave } from 'vue-router'

import { openModalEvent } from '@/utils/events'
import { MenuItem } from '@/utils/types'
import Dropdown from '@/components/Dropdown.vue'
import DropdownMenu from '@/components/DropdownMenu.vue'
import Tag from '@/components/Tag.vue'
import useChannel from '@/composables/useChannel'
import usePermission from '@/composables/usePermission'
import { LastReadKey } from '@/composables/useUnread'
import useLoader from '@/composables/useLoader'

import Comments from '../discussions/Comments.vue'
import AgendaProposals from '../proposals/AgendaProposals.vue'
import TextDocuments from '../proposals/TextDocuments.vue'
import useDiscussions from '../discussions/useDiscussions'
import useMeeting from '../meetings/useMeeting'
import useMeetingTitle from '../meetings/useMeetingTitle'
import useProposals, {
  anyProposal,
  filterProposals
} from '../proposals/useProposals'
import { Proposal, ProposalState } from '../proposals/types'
import { DiscussionPost } from '../discussions/types'
import { TagClickHandlerKey, TagsKey } from '../meetings/useTags'
import PollList from '../polls/PollList.vue'
import usePolls from '../polls/usePolls'
import AddProposalModal from '../proposals/AddProposalModal.vue'
import EditTextDocumentModalVue from '../proposals/EditProposalTextModal.vue'

import useAgenda from './useAgenda'
import AgendaFilters from './AgendaFilters.vue'
import useAgendaFilter from './useAgendaFilter'
import useAgendaItem from './useAgendaItem'
import { lastReadType } from './contentTypes'
import { agendaMenuPlugins } from './registry'
import { agendaIdKey } from './injectionKeys'
import AISpeakerLists from './AISpeakerLists.vue'
import AgendaItemDescription from './AgendaItemDescription.vue'
import useAgendaStore from './useAgendaStore'

const { t } = useI18n()
const discussions = useDiscussions()
const proposals = useProposals()
const { getAiPolls } = usePolls()
const { meetingId, meeting, getMeetingRoute } = useMeeting()
const { agenda } = useAgenda(meetingId)
const { getAgendaItem, hasNewContent } = useAgendaStore()
const {
  agendaId,
  agendaItem,
  agendaItemLastRead,
  agendaBody,
  canAddDocument,
  canAddPoll,
  canAddProposal,
  canChangeAgendaItem,
  proposalBlockReason
} = useAgendaItem()
const {
  agendaFilter,
  isModified,
  clearFilter,
  stateIncluded,
  tagIncluded,
  orderContent
} = useAgendaFilter()

const { isSubscribed, promise } = useChannel('agenda_item', agendaId)
useLoader('AgendaItem', promise)
provide(agendaIdKey, agendaId)
provide(LastReadKey, agendaItemLastRead)

const tProposalBlockReason = computed(() => {
  switch (proposalBlockReason.value) {
    case 'blocked':
      return t('agenda.proposalBlocked.blocked')
    case 'closed':
      return t('agenda.proposalBlocked.closed')
    case 'nonProposer':
      return t('agenda.proposalBlocked.nonProposer')
  }
})

const agendaItemExists = computed(() => {
  if (!agenda.value.length) return
  return !agendaId.value || !!agendaItem.value
})
usePermission(agendaItemExists, { to: getMeetingRoute() })
useMeetingTitle(computed(() => agendaItem.value?.title ?? t('agenda.item')))

function proposalFilter(p: Proposal) {
  return tagIncluded(p.tags) && stateIncluded(p.state)
}
const sortedProposals = computed(() =>
  filterProposals(
    (p) => isAIProposal(p) && proposalFilter(p),
    'created',
    agendaFilter.order
  )
)
const hiddenProposals = computed(() =>
  filterProposals(
    (p) => isAIProposal(p) && !proposalFilter(p),
    'created',
    agendaFilter.order
  )
)
const pollCount = computed(() => getAiPolls(agendaId.value).length)

function discussionFilter(d: DiscussionPost) {
  return tagIncluded(d.tags)
}
const sortedDiscussions = computed(() =>
  orderContent(
    discussions.getAgendaDiscussions(agendaId.value, discussionFilter)
  )
)

const allTags = computed<Set<string>>(() => {
  // Perl achievement unlocked (sry)
  const transform = (getter: (id: number) => { tags: string[] }[]) =>
    Array.prototype.concat.apply(
      [],
      getter(agendaId.value).map((i) => i.tags)
    )
  return new Set([
    ...transform(proposals.getAgendaProposals),
    ...transform(discussions.getAgendaDiscussions)
  ])
})
provide(TagsKey, allTags)

const toNewPoll = computed(() =>
  getMeetingRoute('pollStartAI', { aid: agendaId.value })
)

function getAgendaMenuContext(menu: string) {
  if (!agendaItem.value || !meeting.value)
    throw new Error('Agenda menu context requies agenda item and menu data')
  return {
    agendaItem: agendaItem.value,
    meeting: meeting.value,
    menu,
    t
  }
}

function isAIProposal(p: Proposal) {
  return p.agenda_item === agendaId.value
}

const hasPublishedProposals = computed(() =>
  anyProposal((p) => isAIProposal(p) && p.state === ProposalState.Published)
)

const editDescription = shallowRef(false)
const menuItems = computed<MenuItem[]>(() => {
  if (!agendaItem.value) return []
  const items: MenuItem[] = []
  if (canAddPoll.value) {
    items.push({
      disabled: !hasPublishedProposals.value,
      title: t('poll.new'),
      prependIcon: 'mdi-star-plus',
      to: toNewPoll.value
    })
  }
  if (canChangeAgendaItem.value) {
    items.push({
      title: t('edit'),
      prependIcon: 'mdi-pencil',
      onClick: async () => {
        editDescription.value = true
      }
    })
  }
  if (canAddDocument.value) {
    items.push({
      title: t('proposal.textAdd'),
      prependIcon: 'mdi-text-box-plus-outline',
      onClick: async () =>
        openModalEvent.emit({
          title: t('proposal.textAdd'),
          component: EditTextDocumentModalVue
        })
    })
  }
  // Extra menu items from plugins
  if (!meeting.value || !agendaItem.value) return items
  const menuContext = getAgendaMenuContext('main')
  const pluginMenuItems = agendaMenuPlugins
    .getActivePlugins(meeting.value)
    .flatMap((plugin) => plugin.getItems(menuContext))
  return pluginMenuItems.length ? [...items, '---', ...pluginMenuItems] : items
})

const hasProposals = computed(() => anyProposal(isAIProposal))

function setLastRead(agenda_item: number) {
  // Return if there is no new content
  const ai = getAgendaItem(agenda_item)
  if (!ai || !hasNewContent(ai)) return
  lastReadType.methodCall('change', { agenda_item })
}
// Set last read when leaving route.
onBeforeRouteLeave(() => setLastRead(agendaId.value))
watch(agendaId, (_, leaving) => {
  // Set last read when switching agenda item
  setLastRead(leaving)
})

const filterComponent = shallowRef<ComponentPublicInstance | null>(null)
provide(TagClickHandlerKey, async (tagName) => {
  agendaFilter.tag = tagName
  const el: HTMLElement = filterComponent.value?.$el
  if (!el) return
  await nextTick()
  window.scrollTo({
    top: el.offsetTop - 12,
    behavior: 'smooth'
  })
})
</script>

<template>
  <template v-if="agendaItem">
    <v-row :key="`agenda-header-${agendaId}`">
      <v-col cols="12" lg="8">
        <AgendaItemDescription
          :agenda-item="agendaItem"
          :body="agendaBody"
          :can-edit="canChangeAgendaItem"
          v-model:editing="editDescription"
        >
          <template #appendTitle>
            <DropdownMenu :items="menuItems" />
          </template>
        </AgendaItemDescription>
        <TextDocuments />
      </v-col>
      <v-col cols="12" lg="4">
        <Dropdown
          v-if="pollCount || canAddPoll"
          :title="$t('poll.pollCount', pollCount)"
          modelValue
        >
          <template #actions>
            <v-btn
              :disabled="!hasPublishedProposals"
              icon="mdi-star-plus"
              size="small"
              :to="toNewPoll"
              variant="text"
            />
          </template>
          <PollList :agendaItem="agendaId" class="ml-4" />
        </Dropdown>
        <AISpeakerLists :agendaId="agendaId" />
      </v-col>
    </v-row>
    <v-divider class="my-4" />
    <v-row :key="`agenda-filters-${agendaId}`">
      <v-col class="d-flex">
        <AddProposalModal v-if="canAddProposal">
          <template #activator="{ props }">
            <slot name="activator" :props="props">
              <v-btn
                color="primary"
                :prepend-icon="
                  agendaItem.block_proposals
                    ? 'mdi-lock-outline'
                    : 'mdi-text-box-plus-outline'
                "
                :text="$t('proposal.add')"
                v-bind="props"
              />
            </slot>
          </template>
        </AddProposalModal>
        <v-tooltip v-else :text="tProposalBlockReason">
          <template #activator="{ props }">
            <v-btn
              color="primary"
              prepend-icon="mdi-text-box-plus-outline"
              :text="$t('proposal.add')"
              variant="tonal"
              v-bind="props"
            />
          </template>
        </v-tooltip>
        <v-spacer />
        <AgendaFilters ref="filterComponent" />
      </v-col>
    </v-row>
    <v-row :key="`agenda-content-${agendaId}`">
      <v-col cols="12" md="7" class="agenda-proposals">
        <h2 class="mb-2">
          {{ $t('proposal.proposals') }}
        </h2>
        <v-alert
          v-if="!hasProposals"
          class="mb-2"
          icon="mdi-filter-outline"
          :text="$t('agenda.helpNoProposals')"
          type="info"
        />
        <v-alert
          v-else-if="agendaFilter.tag"
          class="mb-2"
          icon="mdi-filter-outline"
          type="info"
        >
          {{ $t('agenda.filteringOnTag') }}
          <Tag :name="agendaFilter.tag" disabled class="ml-2" />
          <template #append>
            <v-btn
              prepend-icon="mdi-undo-variant"
              size="small"
              :text="$t('defaultFilters')"
              @click="clearFilter"
            />
          </template>
        </v-alert>
        <v-alert
          v-else-if="hasProposals && !sortedProposals.length"
          class="mb-2"
          icon="mdi-filter-outline"
          :text="$t('agenda.helpNoProposalsInFilter')"
          type="info"
        >
          <template #append>
            <v-btn
              v-if="isModified"
              prepend-icon="mdi-undo-variant"
              size="small"
              :text="$t('defaultFilters')"
              @click="clearFilter"
            />
          </template>
        </v-alert>
        <AgendaProposals :proposals="sortedProposals" />
        <Dropdown
          class="mt-8"
          v-if="hiddenProposals.length"
          :title="$t('agenda.hiddenProposals', hiddenProposals.length)"
        >
          <AgendaProposals :proposals="hiddenProposals" />
        </Dropdown>
      </v-col>
      <v-col cols="12" md="5" class="agenda-discussions">
        <h2 class="mb-2">
          {{ $t('discussion.discussions') }}
        </h2>
        <v-progress-circular v-if="!isSubscribed" indeterminate class="my-2" />
        <Comments :comments="sortedDiscussions" />
      </v-col>
    </v-row>
  </template>
</template>
