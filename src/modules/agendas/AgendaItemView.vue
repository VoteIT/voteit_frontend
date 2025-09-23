<script lang="ts" setup>
import { isEqual } from 'lodash'
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
import DropdownMenu from '@/components/DropdownMenu.vue'
import Headline from '@/components/Headline.vue'
import Richtext from '@/components/Richtext.vue'
import RichtextEditor from '@/components/RichtextEditor.vue'
import Tag from '@/components/Tag.vue'
import WorkflowState from '@/components/WorkflowState.vue'
import useChannel from '@/composables/useChannel'
import useDefaults from '@/composables/useDefaults'
import usePermission from '@/composables/usePermission'
import { LastReadKey } from '@/composables/useUnread'
import useLoader from '@/composables/useLoader'
import TagEdit from '@/components/TagEdit.vue'

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
import useTags, { TagClickHandlerKey, TagsKey } from '../meetings/useTags'
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
import AISpeakerLists from './AISpeakerLists.vue'
import { onBeforeRouteLeave } from 'vue-router'

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
  filterProposals(
    (p) => isAIProposal(p) && proposalFilter(p),
    'created',
    activeFilter.value.order
  )
)
const hiddenProposals = computed(() =>
  filterProposals(
    (p) => isAIProposal(p) && !proposalFilter(p),
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

function isAIProposal(p: Proposal) {
  return p.agenda_item === agendaId.value
}

const hasPublishedProposals = computed(() =>
  anyProposal((p) => isAIProposal(p) && p.state === ProposalState.Published)
)

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
        editing.value = true
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

function setLastRead(ai?: AgendaItem) {
  // Return if there is no new content
  if (!ai || !hasNewItems(ai)) return
  lastReadType.methodCall('change', { agenda_item: ai.pk })
}
// Set last read when leaving route.
onBeforeRouteLeave(() => setLastRead(agendaItem.value))

watch(agendaItem, (to, from) => {
  // Set last read when switching agenda item
  setLastRead(from)
  if (!to) return
  editing.value = false
  content.title = to.title // Body from agendaBody, see below
  content.tags = extraTags.value
})
watch(agendaBody, (value) => {
  content.body = value ?? ''
})

const filterComponent = ref<ComponentPublicInstance | null>(null)
const filterTag = computed(() => [...activeFilter.value.tags][0])
const { getHTMLTags } = useTags()
provide(TagClickHandlerKey, async (tagName) => {
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
})

const extraTags = computed(() => {
  if (!agendaItem.value || !agendaBody.value) return []
  const docTags = getHTMLTags(agendaBody.value)
  return agendaItem.value.tags.filter((tag) => !docTags.has(tag))
})
watch(extraTags, (tags) => (content.tags = tags))
const editing = ref(false)
const content = reactive({
  body: agendaBody.value ?? '',
  tags: extraTags.value,
  title: agendaItem.value?.title ?? ''
})
const submitting = ref(false)
const editingModified = computed(
  () =>
    !!agendaItem.value &&
    (content.title !== agendaItem.value.title ||
      content.body !== agendaBody.value ||
      !isEqual(content.tags, agendaItem.value.tags))
)

function cancelEdit() {
  editing.value = false
  content.body = agendaBody.value ?? ''
  content.tags = extraTags.value
  content.title = agendaItem.value?.title ?? ''
}

async function submit() {
  if (!editingModified.value) return
  submitting.value = true
  try {
    await agendaItemType.update(agendaId.value, { ...content })
    editing.value = false
  } catch {} // TODO
  submitting.value = false
}

provide(LastReadKey, agendaItemLastRead)
provide(TagsKey, allTags)

const { collapsedBodyHeight } = useDefaults()
</script>

<template>
  <template v-if="agendaItem">
    <v-row :key="`agenda-header-${agendaId}`">
      <v-col cols="12" lg="8">
        <div v-if="editing" class="mt-6 mb-8">
          <Headline
            v-model="content.title"
            class="mb-2"
            editing
            @submit="submit"
          />
          <RichtextEditor
            v-model="content.body"
            class="mb-2"
            variant="full"
            @keydown.ctrl.enter="submit"
          />
          <TagEdit
            v-model="content.tags"
            class="mb-2"
            :label="$t('agenda.tagEditInfo')"
          />
          <div class="text-right">
            <v-btn variant="text" :text="$t('cancel')" @click="cancelEdit" />
            <v-btn
              color="primary"
              :disabled="!editingModified"
              :loading="submitting"
              :text="$t('save')"
              @click="submit"
            />
          </div>
        </div>
        <div v-else class="mb-8">
          <div class="d-flex">
            <div class="flex-grow-1">
              <WorkflowState
                :admin="canChangeAgendaItem"
                :content-type="agendaItemType"
                :object="agendaItem"
              />
              <h1>{{ agendaItem.title }}</h1>
            </div>
            <DropdownMenu :items="menuItems" />
          </div>
          <Richtext
            v-if="agendaBody"
            :value="agendaBody"
            :maxHeight="collapsedBodyHeight"
          />
        </div>
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
          type="info"
          icon="mdi-filter-outline"
          v-if="!hasProposals"
          class="mb-2"
        >
          {{ $t('agenda.helpNoProposals') }}
        </v-alert>
        <v-alert
          type="info"
          icon="mdi-filter-outline"
          v-else-if="filterTag"
          class="mb-2"
        >
          {{ $t('agenda.filteringOnTag') }}
          <Tag :name="filterTag" disabled class="ml-2" />
          <template #append>
            <v-btn
              prepend-icon="mdi-undo-variant"
              size="small"
              :text="$t('defaultFilters')"
              @click="clearFilters"
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
              @click="clearFilters"
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
