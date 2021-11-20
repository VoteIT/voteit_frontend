<template>
  <template v-if="agendaItem">
    <v-row>
      <v-col cols="12">
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" lg="8">
        <Menu float :items="menuItems" />
        <WorkflowState :admin="canChangeAgendaItem" :content-type="agendaItemType" :object="agendaItem" />
        <Headline :editing="editing" v-model="content.title" @edit-done="submit()" />
        <Richtext :editing="editing" v-model="content.body" @edit-done="submit()" variant="full" class="mb-8" />
        <TextDocuments />
      </v-col>
      <v-col cols="12" lg="4" v-if="speakerLists.length">
        <h2>
          {{ t('speaker.lists', speakerLists.length) }}
        </h2>
        <SpeakerList v-for="list in speakerLists" :key="list.pk" :list="list" />
      </v-col>
    </v-row>
    <v-divider class="my-4" />
    <v-row>
      <v-col class="d-flex">
        <AddProposalModal v-if="canAddProposal" />
        <v-spacer />
        <AgendaFilters ref="filterComponent" :key="agendaId" />
        <div id="agenda-display-mode" class="d-none d-md-block ml-8 text-no-wrap">
          <span class="text-secondary">{{ t('agenda.showAs') }}</span>
          <v-btn :title="t(`agenda.${mode}`)" v-for="mode in ['columns', 'nested']" variant="text" :key="mode" :class="{ active: displayMode === mode }" @click="displayMode = mode">
            <img :src="require(`@/assets/agenda-display-${mode}.svg`).default"/>
          </v-btn>
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" :md="displayMode === 'columns' ? 7 : 12" :lg="displayMode === 'columns' ? 7 : 8" class="agenda-proposals">
        <h2 v-if="displayMode === 'columns'" class="mb-2">{{ t('proposal.proposals') }}</h2>
        <h2 v-else class="mb-2">{{ t('proposal.proposalsAndComments') }}</h2>
        <v-alert type="info" icon="mdi-filter-outline" v-if="!hasProposals" class="mb-2">
          {{ t('agenda.helpNoProposals') }}
        </v-alert>
        <v-alert type="info" icon="mdi-filter-outline" v-else-if="filterTag" class="mb-2">
          <div class="flex-grow-1">
            {{ t('agenda.filteringOnTag') }}
            <Tag :name="filterTag" disabled class="ml-2" />
          </div>
          <v-btn variant="text" size="small" @click="filterComponent.clearFilters()" prepend-icon="mdi-undo-variant">
            {{ t('defaultFilters') }}
          </v-btn>
        </v-alert>
        <v-alert type="info" icon="mdi-filter-outline" v-else-if="hasProposals && !sortedProposals.length" class="mb-2">
          <div class="flex-grow-1">{{ t('agenda.helpNoProposalsInFilter') }}</div>
          <v-btn size="small" variant="text" v-if="filterComponent && filterComponent.isModified" @click="filterComponent.clearFilters()" prepend-icon="mdi-undo-variant">
            {{ t('defaultFilters') }}
          </v-btn>
        </v-alert>
        <AgendaProposals :proposals="sortedProposals" />
      </v-col>
      <v-col v-if="displayMode === 'columns'" cols="12" md="5" class="agenda-discussions">
        <h2 class="mb-2">{{ t('discussion.discussions') }}</h2>
        <AgendaDiscussions :discussionPosts="sortedDiscussions" />
      </v-col>
    </v-row>
  </template>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, onUnmounted, provide, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStorage } from '@vueuse/core'

import { openModalEvent } from '@/utils/events'
import { MenuItem } from '@/utils/types'
import Headline from '@/components/Headline.vue'
import Richtext from '@/components/Richtext.vue'
import WorkflowState from '@/components/WorkflowState.vue'

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
import { proposalType } from '../proposals/contentTypes'
import { discussionPostType } from '../discussions/contentTypes'
import { SpeakerListState } from '../speakerLists/types'
import { DiscussionPost } from '../discussions/types'
import { TagsKey, tagClickEvent } from '../meetings/useTags'
import AddProposalModal from '../proposals/AddProposalModal.vue'
import EditTextDocumentModalVue from '../proposals/EditProposalTextModal.vue'

import useAgenda from './useAgenda'
import AgendaFilters from './AgendaFilters.vue'
import { LastReadKey } from '@/composables/useUnread'
import useAgendaFilter from './useAgendaFilter'
import { AgendaFilterComponent, AgendaItem } from './types'
import useAgendaItem from './useAgendaItem'
import { canAddPoll } from '../polls/rules'
import { agendaItemType } from './contentTypes'

export default defineComponent({
  name: 'AgendaItem',
  setup () {
    const { t } = useI18n()
    const { activeFilter } = useAgendaFilter()
    const discussions = useDiscussions()
    const proposals = useProposals()
    const { meetingPath, meetingId } = useMeeting()
    const { hasNewItems, agendaItemLastRead } = useAgenda()
    const { agendaId, agendaItem, canAddProposal, canAddDiscussionPost, canAddDocument, canChangeAgendaItem } = useAgendaItem()

    useMeetingTitle(computed(() => agendaItem.value?.title ?? t('agenda.item')))

    function proposalFilter (p: Proposal): boolean {
      const { tags, states } = activeFilter.value
      if (tags.size && p.tags.every(t => !tags.has(t))) return false
      return states.has(p.state)
    }
    const sortedProposals = computed(() => {
      let order = activeFilter.value.order
      const reversed = order.startsWith('-')
      if (reversed) order = order.slice(1)
      return proposals.getAgendaProposals(agendaId.value, proposalFilter, order, reversed)
    })

    function discussionFilter (d: DiscussionPost): boolean {
      const { tags } = activeFilter.value
      return !tags.size || d.tags.some(t => tags.has(t))
    }
    const sortedDiscussions = computed(() => discussions.getAgendaDiscussions(agendaId.value, discussionFilter))
    const { getAgendaSpeakerLists, getSystems } = useSpeakerLists()
    const speakerLists = computed(() => getAgendaSpeakerLists(agendaId.value, list => list.state === SpeakerListState.Open))
    const speakerSystems = computed(() => getSystems(meetingId.value))

    const displayMode = useStorage('agendaDisplayMode', 'columns')

    const allTags = computed<Set<string>>(() => {
      // Perl achievement unlocked (sry)
      const transform = (getter: (id: number) => { tags: string[] }[]) => Array.prototype.concat.apply([], getter(agendaId.value).map(i => i.tags))
      return new Set([...transform(proposals.getAgendaProposals), ...transform(discussions.getAgendaDiscussions)])
    })
    async function addProposal (body: string, tags: string[]) {
      await proposalType.api.add({
        agenda_item: agendaId.value,
        body,
        tags
      })
    }
    async function addDiscussionPost (body: string, tags: string[]) {
      await discussionPostType.api.add({
        agenda_item: agendaId.value,
        body,
        tags
      })
    }

    const menuItems = computed<MenuItem[]>(() => {
      if (!agendaItem.value) return []
      const items: MenuItem[] = []
      if (canAddPoll(agendaItem.value)) {
        items.push({
          title: t('poll.new'),
          icon: 'mdi-star',
          to: `${meetingPath.value}/polls/new/${agendaId.value}`
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
      const speakerSystems = getSystems(meetingId.value, false, true)
      if (speakerSystems.length) {
        items.push('---')
        for (const system of speakerSystems) {
          items.push({
            title: t('speaker.manageSystem', { ...system }),
            icon: 'mdi-bullhorn',
            to: `${meetingPath.value}/lists/${system.pk}/${agendaId.value}`
          })
        }
      }
      return items
    })

    const hasProposals = computed(() => proposals.agendaItemHasProposals(agendaId.value))

    function setLastRead (ai: AgendaItem, force = false) {
      // Allow forcing read marker, on user demand
      if (force) return agendaItemType.channel.send('last_read.change', { agenda_item: ai.pk })
      // Return if there is no new content
      if (!ai || !hasNewItems(ai)) return
      agendaItemType.channel.send('last_read.change', {
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
      title: agendaItem.value?.title,
      body: agendaItem.value?.body
    })
    function submit () {
      editing.value = false
      if (content.title === agendaItem.value?.title && content.body === agendaItem.value?.body) return
      agendaItemType.channel.change(agendaId.value, { ...content })
    }

    provide(LastReadKey, agendaItemLastRead)
    provide(TagsKey, allTags)

    return {
      t,
      agendaId,
      agendaItem,
      canAddProposal,
      canAddDiscussionPost,
      canChangeAgendaItem,
      content,
      ...discussions,
      displayMode,
      editing,
      filterComponent,
      filterTag,
      meetingPath,
      menuItems,
      hasProposals,
      sortedProposals,
      sortedDiscussions,
      speakerLists,
      speakerSystems,

      agendaItemType,

      addDiscussionPost,
      addProposal,
      setLastRead,
      submit
    }
  },
  components: {
    AddProposalModal,
    AgendaDiscussions,
    AgendaProposals,
    Headline,
    AgendaFilters,
    SpeakerList,
    Richtext,
    WorkflowState,
    TextDocuments
  }
})
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
