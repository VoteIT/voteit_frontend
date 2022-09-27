<template>
  <template v-if="agendaItem">
    <v-row :key="`agenda-header-${agendaId}`">
      <v-col cols="12" lg="8">
        <div class="d-flex">
          <div class="flex-grow-1">
            <WorkflowState :admin="canChangeAgendaItem" :content-type="agendaItemType" :object="agendaItem" />
            <Headline :editing="editing" v-model="content.title" @edit-done="submit()" />
          </div>
          <DropdownMenu float :items="menuItems" />
        </div>
        <Richtext :editing="editing" v-model="content.body" @edit-done="submit()" variant="full" class="mb-8" :maxHeight="collapsedBodyHeight" />
        <TextDocuments />
      </v-col>
      <v-col cols="12" lg="4">
        <Dropdown v-if="pollCount || canAddPoll" :title="t('poll.pollCount', pollCount)" modelValue>
          <template #actions>
            <v-btn icon="mdi-star-plus" variant="text" size="small" :to="toNewPoll" />
          </template>
          <PollList :agendaItem="agendaId" class="ml-4" />
        </Dropdown>
        <Dropdown v-if="speakerLists.length || manageSpeakerListsMenu.length" :title="t('speaker.lists', speakerLists.length)" modelValue>
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
          <SpeakerList v-for="list in speakerLists" :key="list.pk" :list="list" />
        </Dropdown>
      </v-col>
    </v-row>
    <v-divider class="my-4" />
    <v-row :key="`agenda-filters-${agendaId}`">
      <v-col class="d-flex">
        <v-dialog v-if="canAddProposal" persistent>
          <template #activator="{ props }">
            <slot name="activator" :props="props">
              <v-btn :prepend-icon="agendaItem.block_proposals ? 'mdi-lock-outline' : 'mdi-text-box-plus-outline'" color="primary" v-bind="props">
                {{ t('proposal.add') }}
              </v-btn>
            </slot>
          </template>
          <template v-slot="{ isActive }">
            <AddProposalModal @close="isActive.value = false" />
          </template>
        </v-dialog>
        <v-tooltip v-else :text="t(`agenda.proposalBlocked.${proposalBlockReason}`)">
          <template #activator="{ props }">
            <v-btn v-bind="props" prepend-icon="mdi-text-box-plus-outline" color="primary" variant="tonal">
              {{ t('proposal.add') }}
            </v-btn>
          </template>
        </v-tooltip>
        <v-spacer />
        <AgendaFilters ref="filterComponent" />
        <div id="agenda-display-mode" class="d-none d-md-block ml-8 text-no-wrap">
          <span class="text-secondary">{{ t('agenda.showAs') }}</span>
          <v-btn :title="t(`agenda.${mode}`)" v-for="mode in ['columns', 'nested']" variant="text" :key="mode" :class="{ active: displayMode === mode }" @click="displayMode = mode">
            <img :src="require(`@/assets/agenda-display-${mode}.svg`)"/>
          </v-btn>
        </div>
      </v-col>
    </v-row>
    <v-row :key="`agenda-content-${agendaId}`">
      <v-col cols="12" :md="displayMode === 'columns' ? 7 : 12" :lg="displayMode === 'columns' ? 7 : 8" class="agenda-proposals">
        <h2 v-if="displayMode === 'columns'" class="mb-2">{{ t('proposal.proposals') }}</h2>
        <h2 v-else class="mb-2">{{ t('proposal.proposalsAndComments') }}</h2>
        <v-alert type="info" icon="mdi-filter-outline" v-if="!hasProposals" class="mb-2">
          {{ t('agenda.helpNoProposals') }}
        </v-alert>
        <v-alert type="info" icon="mdi-filter-outline" v-else-if="filterTag" class="mb-2">
          <div class="flex-grow-1 mb-2">
            {{ t('agenda.filteringOnTag') }}
            <Tag :name="filterTag" disabled class="ml-2" />
          </div>
          <v-btn size="small" @click="filterComponent?.clearFilters()" prepend-icon="mdi-undo-variant">
            {{ t('defaultFilters') }}
          </v-btn>
        </v-alert>
        <v-alert type="info" icon="mdi-filter-outline" v-else-if="hasProposals && !sortedProposals.length" class="mb-2">
          <div class="flex-grow-1 mb-2">
            {{ t('agenda.helpNoProposalsInFilter') }}
          </div>
          <v-btn size="small" v-if="filterComponent && filterComponent.isModified" @click="filterComponent?.clearFilters()" prepend-icon="mdi-undo-variant">
            {{ t('defaultFilters') }}
          </v-btn>
        </v-alert>
        <AgendaProposals :proposals="sortedProposals" />
        <Dropdown class="mt-8" v-if="hiddenProposals.length" :title="t('agenda.hiddenProposals', hiddenProposals.length)">
          <AgendaProposals :proposals="hiddenProposals" />
        </Dropdown>
      </v-col>
      <v-col v-if="displayMode === 'columns'" cols="12" md="5" class="agenda-discussions">
        <h2 class="mb-2">{{ t('discussion.discussions') }}</h2>
        <AgendaDiscussions :discussionPosts="sortedDiscussions" />
      </v-col>
    </v-row>
  </template>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, provide, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStorage } from '@vueuse/core'

import { openModalEvent } from '@/utils/events'
import { MenuItem } from '@/utils/types'
import Dropdown from '@/components/Dropdown.vue'
import Headline from '@/components/Headline.vue'
import Richtext from '@/components/Richtext.vue'
import WorkflowState from '@/components/WorkflowState.vue'
import useChannel from '@/composables/useChannel'
import useDefaults from '@/composables/useDefaults'
import usePermission from '@/composables/usePermission'

import AgendaDiscussions from '../discussions/AgendaDiscussions.vue'
import AgendaProposals from '../proposals/AgendaProposals.vue'
import SpeakerList from '../speakerLists/SpeakerList.vue'
import TextDocuments from '../proposals/TextDocuments.vue'
import useDiscussions from '../discussions/useDiscussions'
import useMeeting from '../meetings/useMeeting'
import useMeetingTitle from '../meetings/useMeetingTitle'
import useProposals from '../proposals/useProposals'
import { Proposal } from '../proposals/types'
import useSpeakerLists from '../speakerLists/useSpeakerLists'
import useSpeakerSystems from '../speakerLists/useSpeakerSystems'
import { DiscussionPost } from '../discussions/types'
import { TagsKey, tagClickEvent } from '../meetings/useTags'
import PollList from '../polls/PollList.vue'
import usePolls from '../polls/usePolls'
import AddProposalModal from '../proposals/AddProposalModal.vue'
import EditTextDocumentModalVue from '../proposals/EditProposalTextModal.vue'

import useAgenda from './useAgenda'
import AgendaFilters from './AgendaFilters.vue'
import { LastReadKey } from '@/composables/useUnread'
import useAgendaFilter from './useAgendaFilter'
import { AgendaFilterComponent, AgendaItem } from './types'
import useAgendaItem from './useAgendaItem'
import { agendaItemType, lastReadType } from './contentTypes'
import { agendaMenuPlugins } from './registry'
import { agendaIdKey } from './injectionKeys'

const { t } = useI18n()
const discussions = useDiscussions()
const proposals = useProposals()
const { getAiPolls } = usePolls()
const { meetingPath, meetingId, meeting } = useMeeting()
const { agendaId, agenda, agendaItemLastRead, hasNewItems } = useAgenda(meetingId)
const { activeFilter, sortOrder, orderContent } = useAgendaFilter(agendaId)
const { agendaItem, agendaItemPath, canAddDocument, canAddPoll, canAddProposal, canChangeAgendaItem, proposalBlockReason } = useAgendaItem(agendaId)

useChannel('agenda_item', agendaId)
provide(agendaIdKey, agendaId)

const agendaItemExists = computed(() => {
  if (!agenda.value.length) return
  return !agendaId.value || !!agendaItem.value
})
usePermission(agendaItemExists, { to: meetingPath })
useMeetingTitle(computed(() => agendaItem.value?.title ?? t('agenda.item')))

function proposalFilter (p: Proposal): boolean {
  const { tags, states } = activeFilter.value
  if (tags.size && p.tags.every(t => !tags.has(t))) return false
  return states.has(p.state)
}
const sortedProposals = computed(() => {
  const { order, direction } = sortOrder.value
  return proposals.getAgendaProposals(agendaId.value, proposalFilter, order, direction)
})
const hiddenProposals = computed(() => {
  const { order, direction } = sortOrder.value
  return proposals.getAgendaProposals(agendaId.value, p => !proposalFilter(p), order, direction)
})
const pollCount = computed(() => getAiPolls(agendaId.value).length)

function discussionFilter (d: DiscussionPost): boolean {
  const { tags } = activeFilter.value
  return !tags.size || d.tags.some(t => tags.has(t))
}
const sortedDiscussions = computed(() => orderContent(discussions.getAgendaDiscussions(agendaId.value, discussionFilter)))
const { activeSpeakerSystems, managingSpeakerSystems } = useSpeakerSystems(meetingId)
const { getAgendaSpeakerLists } = useSpeakerLists()
const speakerLists = computed(() => getAgendaSpeakerLists(
  agendaId.value,
  list => !!activeSpeakerSystems.value.find(system => system.pk === list.speaker_system)
))

const displayMode = useStorage('agendaDisplayMode', 'columns')

const allTags = computed<Set<string>>(() => {
  // Perl achievement unlocked (sry)
  const transform = (getter: (id: number) => { tags: string[] }[]) => Array.prototype.concat.apply([], getter(agendaId.value).map(i => i.tags))
  return new Set([...transform(proposals.getAgendaProposals), ...transform(discussions.getAgendaDiscussions)])
})

const toNewPoll = computed(() => `${meetingPath.value}/polls/new/${agendaId.value}`)

function getAgendaMenuContext (menu: string) {
  if (!agendaItem.value || !meeting.value || !agendaItemPath.value) throw new Error('Agenda menu context requies agenda item and menu data')
  return {
    agendaItem: agendaItem.value,
    agendaItemPath: agendaItemPath.value,
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
      icon: 'mdi-star-plus',
      to: toNewPoll.value
    })
  }
  if (canChangeAgendaItem.value) {
    items.push({
      title: t('edit'),
      icon: 'mdi-pencil',
      onClick: async () => { editing.value = true }
    })
    items.push({
      title: t('plenary.view'),
      icon: 'mdi-gavel',
      to: `/p/${meetingId.value}/${agendaId.value}`
    })
  }
  if (canAddDocument.value) {
    items.push({
      title: t('proposal.textAdd'),
      icon: 'mdi-text-box-plus-outline',
      onClick: async () => openModalEvent.emit({
        title: t('proposal.textAdd'),
        component: EditTextDocumentModalVue
      })
    })
  }
  // Extra menu items from plugins
  if (!meeting.value || !agendaItem.value) return items
  const pluginMenuItems = agendaMenuPlugins
    .getActivePlugins(meeting.value)
    .flatMap(plugin => plugin.getItems(getAgendaMenuContext('main')))
  if (pluginMenuItems.length) {
    if (items.length) items.push('---')
    Array.prototype.push.apply(items, pluginMenuItems)
  }
  return items
})

const manageSpeakerListsMenu = computed(() => {
  return managingSpeakerSystems.value.map(system => ({
    title: t('speaker.manageSystem', { ...system }),
    icon: 'mdi-bullhorn',
    to: `${meetingPath.value}/lists/${system.pk}/${agendaId.value}`
  }))
})

const hasProposals = computed(() => proposals.agendaItemHasProposals(agendaId.value))

function setLastRead (ai: AgendaItem, force = false) {
  // Allow forcing read marker, on user demand
  if (force) return lastReadType.methodCall('last_read.change', { agenda_item: ai.pk })
  // Return if there is no new content
  if (!ai || !hasNewItems(ai)) return
  lastReadType.methodCall('change', {
    agenda_item: ai.pk
  })
}
watch(agendaItem, (value, oldValue) => {
  // When leaving agenda item
  if (oldValue) setLastRead(oldValue)
  if (value) {
    content.title = value.title
    content.body = value.body
  }
})

const filterComponent = ref<AgendaFilterComponent | null>(null)
async function toggleTag (tagName: string) {
  activeFilter.value.tags = new Set([tagName])
  const el: HTMLElement = filterComponent.value?.$el
  if (!el) return
  await nextTick()
  window.scrollTo({
    top: el.offsetTop - 12,
    behavior: 'smooth'
  })
}
const filterTag = computed(() => [...activeFilter.value.tags][0])
onMounted(() => {
  tagClickEvent.on(toggleTag)
})
onUnmounted(() => {
  tagClickEvent.off(toggleTag)
})

const editing = ref(false)
const content = reactive({
  title: agendaItem.value?.title ?? '',
  body: agendaItem.value?.body ?? ''
})
function submit () {
  editing.value = false
  if (content.title === agendaItem.value?.title && content.body === agendaItem.value?.body) return
  agendaItemType.update(agendaId.value, { ...content })
}

provide(LastReadKey, agendaItemLastRead)
provide(TagsKey, allTags)

const { collapsedBodyHeight } = useDefaults()
</script>

<style lang="sass">
#agenda-display-mode
  button
    border-radius: 0
    min-width: 40px
    padding: 0
    opacity: .5
    margin-left: .5em
    &.active
      opacity: 1
      border-bottom: 1px solid #000
  span
    vertical-align: middle
    font-size: 12pt
  img
    width: 24px
    height: auto
</style>
