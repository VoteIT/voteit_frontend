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
      <v-col>
        <div class="d-flex">
          <AddProposalModal v-if="canAddProposal" />
          <!-- <v-btn variant="text" @click="focusProposalInput.emit()" v-if="canAddProposal" prepend-icon="mdi-text-box-plus-outline" color="primary">
            {{ t('proposal.add') }}
          </v-btn>
          <v-btn variant="text" @click="focusDiscussionInput.emit()" v-if="displayMode === 'columns' && canAddDiscussionPost" prepend-icon="mdi-comment-text-outline" color="primary" class="d-none d-md-inline">
            {{ t('discussion.add') }}
          </v-btn> -->
          <v-spacer />
          <AgendaFilters ref="filterComponent" :key="agendaId" />
          <div id="agenda-display-mode" class="d-none d-md-block ml-8">
            <span class="text-secondary">{{ t('agenda.showAs') }}</span>
            <v-btn :title="t(`agenda.${mode}`)" v-for="mode in ['columns', 'nested']" variant="text" :key="mode" :class="{ active: displayMode === mode }" @click="displayMode = mode">
              <img :src="require(`@/assets/agenda-display-${mode}.svg`).default"/>
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" :md="displayMode === 'columns' ? 7 : 12" :lg="displayMode === 'columns' ? 7 : 8" class="agenda-proposals">
        <h2 v-if="displayMode === 'columns'">{{ t('proposal.proposals') }}</h2>
        <h2 v-else>{{ t('proposal.proposalsAndComments') }}</h2>
        <v-alert type="info" icon="mdi-filter-outline" v-if="hasProposals && !sortedProposals.length" class="mb-2">
          <div>
            <div class="mb-2">{{ t('agenda.helpNoProposalsInFilter') }}</div>
            <v-btn v-if="filterComponent && filterComponent.isModified" @click="filterComponent.clearFilters()" prepend-icon="mdi-undo-variant">
              {{ t('defaultFilters') }}
            </v-btn>
          </div>
        </v-alert>
        <AgendaProposals :proposals="sortedProposals" />
      </v-col>
      <v-col v-if="displayMode === 'columns'" cols="12" md="5" class="agenda-discussions">
        <h2>{{ t('discussion.discussions') }}</h2>
        <AgendaDiscussions :discussionPosts="sortedDiscussions" />
      </v-col>
    </v-row>
  </template>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, provide, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStorage, useTitle } from '@vueuse/core'

import AgendaFilters from './AgendaFilters.vue'
import Headline from '@/components/Headline.vue'
import Richtext from '@/components/Richtext.vue'
import WorkflowState from '@/components/WorkflowState.vue'
import SpeakerList from '@/modules/speakerLists/SpeakerList.vue'
import TextDocuments from '@/modules/proposals/TextDocuments.vue'
import AgendaDiscussions from '../discussions/AgendaDiscussions.vue'
import AgendaProposals from '../proposals/AgendaProposals.vue'

import useAgenda from '@/modules/agendas/useAgenda'
import useDiscussions from '@/modules/discussions/useDiscussions'
import useMeeting from '@/modules/meetings/useMeeting'
import useProposals from '@/modules/proposals/useProposals'
import { Proposal } from '@/modules/proposals/types'
import useSpeakerLists from '@/modules/speakerLists/useSpeakerLists'
import { proposalType } from '../proposals/contentTypes'
import { discussionPostType } from '../discussions/contentTypes'

import { MenuItem } from '@/utils/types'
import { SpeakerListState } from '../speakerLists/types'
import { DiscussionPost } from '@/modules/discussions/types'
import { LastReadKey } from '@/composables/useUnread'
import { TagsKey, tagClickEvent } from '@/modules/meetings/useTags'
import useAgendaFilter from './useAgendaFilter'
import { AgendaFilterComponent, AgendaItem } from './types'
import { openModalEvent } from '@/utils'
import EditTextDocumentModalVue from '../proposals/EditProposalTextModal.vue'
import AddProposalModal from '../proposals/AddProposalModal.vue'
import useAgendaItem from './useAgendaItem'
// import { focusDiscussionInput, focusProposalInput } from './events'
import { canAddPoll } from '../polls/rules'
import { agendaItemType } from './contentTypes'

export default defineComponent({
  name: 'AgendaItem',
  setup () {
    const { t } = useI18n()
    const { activeFilter } = useAgendaFilter()
    const discussions = useDiscussions()
    const proposals = useProposals()
    const { meetingPath, meetingId, meeting } = useMeeting()
    const { hasNewItems, agendaItemLastRead } = useAgenda()
    const { agendaId, agendaItem, canAddProposal, canAddDiscussionPost, canAddDocument, canChangeAgendaItem } = useAgendaItem()

    useTitle(computed(() => `${agendaItem.value?.title ?? t('agenda.item')} | ${meeting.value?.title ?? t('meeting')}`))

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
            title: t('speaker.manageSystem', system as any),
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
    function toggleTag (tagName: string) {
      activeFilter.value.tags = new Set([tagName])
      // if (tags.has(tagName)) tags.delete(tagName)
      // else tags.add(tagName)
    }
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
      // focusDiscussionInput,
      // focusProposalInput,
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
.agenda-proposals .proposal
  border-top: 1px solid rgb(var(--v-border-color))
  margin-top: 1em
  padding-top: 1em

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
