<template>
  <template v-if="agendaItem">
    <v-row :key="`agenda-header-${agendaId}`">
      <v-col cols="12" lg="8">
        <div class="d-flex">
          <div class="flex-grow-1">
            <WorkflowState
              :admin="canChangeAgendaItem"
              :content-type="agendaItemType"
              :object="agendaItem"
            />
            <Headline
              :editing="editing"
              v-model="content.title"
              @edit-done="submit"
            />
          </div>
          <DropdownMenu float :items="menuItems" />
        </div>
        <Richtext
          :editing="editing"
          v-model="content.body"
          @edit-done="submit"
          variant="full"
          class="mb-8"
          :maxHeight="collapsedBodyHeight"
        />
        <TextDocuments />
      </v-col>
      <v-col cols="12" lg="4">
        <Dropdown
          v-if="pollCount || canAddPoll"
          :title="t('poll.pollCount', pollCount)"
          modelValue
        >
          <template #actions>
            <v-btn
              icon="mdi-star-plus"
              variant="text"
              size="small"
              :to="toNewPoll"
            />
          </template>
          <PollList :agendaItem="agendaId" class="ml-4" />
        </Dropdown>
        <Dropdown
          v-if="speakerLists.length || manageSpeakerListsMenu.length"
          :title="t('speaker.lists', speakerLists.length)"
          modelValue
        >
          <template #actions v-if="manageSpeakerListsMenu.length">
            <v-tooltip :text="t('speaker.manageLists')">
              <template #activator="{ props }">
                <DropdownMenu
                  v-if="manageSpeakerListsMenu.length > 1"
                  v-bind="props"
                  :items="manageSpeakerListsMenu"
                  icon="mdi-bullhorn"
                  size="small"
                />
                <v-btn
                  v-else
                  v-bind="props"
                  size="small"
                  variant="text"
                  :to="manageSpeakerListsMenu[0].to"
                  icon="mdi-bullhorn"
                />
              </template>
            </v-tooltip>
          </template>
          <SpeakerList
            v-for="list in speakerLists"
            :key="list.pk"
            :list="list"
          />
        </Dropdown>
      </v-col>
    </v-row>
    <v-divider class="my-4" />
    <v-row :key="`agenda-filters-${agendaId}`">
      <v-col class="d-flex">
        <DefaultDialog v-if="canAddProposal" persistent>
          <template #activator="{ props }">
            <slot name="activator" :props="props">
              <v-btn
                :prepend-icon="
                  agendaItem.block_proposals
                    ? 'mdi-lock-outline'
                    : 'mdi-text-box-plus-outline'
                "
                color="primary"
                v-bind="props"
              >
                {{ t('proposal.add') }}
              </v-btn>
            </slot>
          </template>
          <template #default="{ close }">
            <AddProposalModal @close="close" />
          </template>
        </DefaultDialog>
        <v-tooltip v-else :text="tProposalBlockReason">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              prepend-icon="mdi-text-box-plus-outline"
              color="primary"
              variant="tonal"
            >
              {{ t('proposal.add') }}
            </v-btn>
          </template>
        </v-tooltip>
        <v-spacer />
        <AgendaFilters ref="filterComponent" />
      </v-col>
    </v-row>
    <v-row :key="`agenda-content-${agendaId}`">
      <v-col cols="12" md="7" class="agenda-proposals">
        <h2 class="mb-2">
          {{ t('proposal.proposals') }}
        </h2>
        <v-alert
          type="info"
          icon="mdi-filter-outline"
          v-if="!hasProposals"
          class="mb-2"
        >
          {{ t('agenda.helpNoProposals') }}
        </v-alert>
        <v-alert
          type="info"
          icon="mdi-filter-outline"
          v-else-if="filterTag"
          class="mb-2"
        >
          {{ t('agenda.filteringOnTag') }}
          <Tag :name="filterTag" disabled class="ml-2" />
          <template #append>
            <v-btn
              size="small"
              @click="clearFilters"
              prepend-icon="mdi-undo-variant"
            >
              {{ t('defaultFilters') }}
            </v-btn>
          </template>
        </v-alert>
        <v-alert
          type="info"
          icon="mdi-filter-outline"
          v-else-if="hasProposals && !sortedProposals.length"
          class="mb-2"
        >
          {{ t('agenda.helpNoProposalsInFilter') }}
          <template #append>
            <v-btn
              size="small"
              v-if="isModified"
              @click="clearFilters"
              prepend-icon="mdi-undo-variant"
            >
              {{ t('defaultFilters') }}
            </v-btn>
          </template>
        </v-alert>
        <AgendaProposals :proposals="sortedProposals" />
        <Dropdown
          class="mt-8"
          v-if="hiddenProposals.length"
          :title="t('agenda.hiddenProposals', hiddenProposals.length)"
        >
          <AgendaProposals :proposals="hiddenProposals" />
        </Dropdown>
      </v-col>
      <v-col cols="12" md="5" class="agenda-discussions">
        <h2 class="mb-2">
          {{ t('discussion.discussions') }}
        </h2>
        <v-progress-circular v-if="!isSubscribed" indeterminate class="my-2" />
        <Comments :comments="sortedDiscussions" />
      </v-col>
    </v-row>
  </template>
</template>

<script lang="ts" setup>
import {
  ComponentPublicInstance,
  computed,
  nextTick,
  provide,
  reactive,
  ref,
  watch
} from 'vue'
import { useI18n } from 'vue-i18n'

import { openModalEvent } from '@/utils/events'
import { MenuItem } from '@/utils/types'
import Dropdown from '@/components/Dropdown.vue'
import Headline from '@/components/Headline.vue'
import Richtext from '@/components/Richtext.vue'
import WorkflowState from '@/components/WorkflowState.vue'
import useChannel from '@/composables/useChannel'
import useDefaults from '@/composables/useDefaults'
import usePermission from '@/composables/usePermission'
import { LastReadKey } from '@/composables/useUnread'
import DefaultDialog from '@/components/DefaultDialog.vue'
import useLoader from '@/composables/useLoader'

import Comments from '../discussions/Comments.vue'
import AgendaProposals from '../proposals/AgendaProposals.vue'
import SpeakerList from '../speakerLists/SpeakerList.vue'
import TextDocuments from '../proposals/TextDocuments.vue'
import useDiscussions from '../discussions/useDiscussions'
import useMeeting from '../meetings/useMeeting'
import useMeetingTitle from '../meetings/useMeetingTitle'
import useProposals from '../proposals/useProposals'
import { Proposal, ProposalState } from '../proposals/types'
import useSpeakerLists from '../speakerLists/useSpeakerLists'
import useSpeakerSystems from '../speakerLists/useSpeakerSystems'
import { DiscussionPost } from '../discussions/types'
import useTags, { TagsKey } from '../meetings/useTags'
import PollList from '../polls/PollList.vue'
import usePolls from '../polls/usePolls'
import AddProposalModal from '../proposals/AddProposalModal.vue'
import EditTextDocumentModalVue from '../proposals/EditProposalTextModal.vue'

import useAgenda from './useAgenda'
import AgendaFilters from './AgendaFilters.vue'
import useAgendaFilter from './useAgendaFilter'
import { AgendaItem } from './types'
import useAgendaItem from './useAgendaItem'
import { agendaItemType, lastReadType } from './contentTypes'
import { agendaMenuPlugins } from './registry'
import { agendaIdKey } from './injectionKeys'

const { t } = useI18n()
const discussions = useDiscussions()
const proposals = useProposals()
const { getAiPolls } = usePolls()
const { meetingId, meeting, getMeetingRoute } = useMeeting()
const { agendaId, agenda, agendaItemLastRead, hasNewItems } =
  useAgenda(meetingId)
const { activeFilter, isModified, clearFilters, orderContent } =
  useAgendaFilter(agendaId)
const {
  agendaItem,
  agendaBody,
  canAddDocument,
  canAddPoll,
  canAddProposal,
  canChangeAgendaItem,
  proposalBlockReason
} = useAgendaItem(agendaId)

const { isSubscribed, promise } = useChannel('agenda_item', agendaId)
useLoader('AgendaItem', promise)
provide(agendaIdKey, agendaId)

// eslint-disable-next-line vue/return-in-computed-property
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

function proposalFilter(p: Proposal): boolean {
  const { tags, states } = activeFilter.value
  if (tags.size && p.tags.every((t) => !tags.has(t))) return false
  return states.has(p.state)
}
const sortedProposals = computed(() =>
  proposals.getAgendaProposals(
    agendaId.value,
    proposalFilter,
    'created',
    activeFilter.value.order
  )
)
const hiddenProposals = computed(() =>
  proposals.getAgendaProposals(
    agendaId.value,
    (p) => !proposalFilter(p),
    'created',
    activeFilter.value.order
  )
)
const pollCount = computed(() => getAiPolls(agendaId.value).length)

function discussionFilter(d: DiscussionPost): boolean {
  const { tags } = activeFilter.value
  return !tags.size || d.tags.some((t) => tags.has(t))
}
const sortedDiscussions = computed(() =>
  orderContent(
    discussions.getAgendaDiscussions(agendaId.value, discussionFilter)
  )
)
const { activeSpeakerSystems, managingSpeakerSystems } =
  useSpeakerSystems(meetingId)
const { getAgendaSpeakerLists } = useSpeakerLists()
const speakerLists = computed(() =>
  getAgendaSpeakerLists(
    agendaId.value,
    (list) =>
      !!activeSpeakerSystems.value.find(
        (system) => system.pk === list.speaker_system
      )
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

const menuItems = computed<MenuItem[]>(() => {
  if (!agendaItem.value) return []
  const items: MenuItem[] = []
  if (canAddPoll.value) {
    items.push({
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
        editing.value = true
      }
    })
    items.push({
      title: t('plenary.view'),
      prependIcon: 'mdi-gavel',
      to: {
        name: 'Plenary',
        params: {
          id: meetingId.value,
          aid: agendaId.value
        }
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
  const pluginMenuItems = agendaMenuPlugins
    .getActivePlugins(meeting.value)
    .flatMap((plugin) => plugin.getItems(getAgendaMenuContext('main')))
  if (pluginMenuItems.length) {
    if (items.length) items.push('---')
    Array.prototype.push.apply(items, pluginMenuItems)
  }
  return items
})

const manageSpeakerListsMenu = computed(() => {
  return managingSpeakerSystems.value.map((system) => ({
    title: t('speaker.manageSystem', { ...system }),
    prependIcon: 'mdi-bullhorn',
    to: getMeetingRoute('speakerLists', {
      system: system.pk,
      aid: agendaId.value
    })
  }))
})

const hasProposals = computed(() =>
  proposals.agendaItemHasProposals(agendaId.value)
)

function setLastRead(ai: AgendaItem, force = false) {
  // Allow forcing read marker, on user demand
  if (force)
    return lastReadType.methodCall('last_read.change', { agenda_item: ai.pk })
  // Return if there is no new content
  if (!ai || !hasNewItems(ai)) return
  lastReadType.methodCall('change', {
    agenda_item: ai.pk
  })
}
watch(agendaItem, (to, from) => {
  // When leaving agenda item
  // FIXME should react to agendaId or onRouteLeave
  if (from) setLastRead(from)
  if (to) content.title = to.title // Body from agendaBody, see below
})
watch(agendaBody, (value) => {
  content.body = value ?? ''
})

const filterComponent = ref<ComponentPublicInstance | null>(null)
async function selectTag(tagName: string) {
  activeFilter.value.tags = new Set([tagName])
  activeFilter.value.states = new Set([
    ProposalState.Approved,
    ProposalState.Denied,
    ProposalState.Published,
    ProposalState.Retracted,
    ProposalState.Unhandled,
    ProposalState.Voting
  ])
  const el: HTMLElement = filterComponent.value?.$el
  if (!el) return
  await nextTick()
  window.scrollTo({
    top: el.offsetTop - 12,
    behavior: 'smooth'
  })
}
const filterTag = computed(() => [...activeFilter.value.tags][0])
useTags(undefined, selectTag)

const editing = ref(false)
const content = reactive({
  title: agendaItem.value?.title ?? '',
  body: agendaBody.value ?? ''
})
function submit() {
  editing.value = false
  if (
    content.title === agendaItem.value?.title &&
    content.body === agendaBody.value
  )
    return
  agendaItemType.update(agendaId.value, { ...content })
}

provide(LastReadKey, agendaItemLastRead)
provide(TagsKey, allTags)

const { collapsedBodyHeight } = useDefaults()
</script>
