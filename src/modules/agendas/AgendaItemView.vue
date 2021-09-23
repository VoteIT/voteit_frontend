<template>
  <template v-if="agendaItem">
    <v-row>
      <v-col>
        <div id="agenda-display-mode">
          <span class="text-secondary">{{ t('agenda.showAs') }}</span>
          <v-btn :title="t(`agenda.${mode}`)" v-for="mode in ['columns', 'nested']" variant="text" :key="mode" :class="{ active: displayMode === mode }" @click="displayMode = mode">
            <img :src="require(`@/assets/agenda-display-${mode}.svg`).default"/>
          </v-btn>
        </div>
        <Menu float :items="menuItems" />
        <Headline :editing="editing" v-model="content.title" @edit-done="submit()" />
        <WorkflowState :admin="agendaItemType.rules.canChange(agendaItem)" :content-type="agendaItemType" :object="agendaItem" />
        <Richtext :editing="editing" v-model="content.body" @edit-done="submit()" />
      </v-col>
    </v-row>
    <v-row v-if="speakerLists.length">
      <v-col v-for="list in speakerLists" :key="list.pk">
        <SpeakerList :list="list" />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" :md="displayMode === 'columns' ? 7 : 8" class="agenda-proposals">
        <h2 v-if="displayMode === 'columns'">{{ t('proposal.proposals') }}</h2>
        <h2 v-else>{{ t('proposal.proposalsAndComments') }}</h2>
        <div class="btn-actions space-between mb-2">
          <span>
            <v-btn @click="addProposalComponent.focus()" v-if="proposalType.rules.canAdd(agendaItem)" prepend-icon="mdi-plus" color="primary">
              {{ t('proposal.add') }}
            </v-btn>
          </span>
          <AgendaFilters ref="filterComponent" v-model="activeFilter" :key="agendaId" />
        </div>
        <!-- <v-alert type="info" v-if="hiddenUnreadProposals" icon="mdi-filter-outline">
          <div>
            <div class="mb-2">
              You have unread proposals that are hidden by your filter.
            </div>
            <div>
              <v-btn @click="setLastRead(agendaItem, true)" prepend-icon="mdi-check-all">
                Mark all as read
              </v-btn>
              <v-btn v-if="filterComponent && filterComponent.isModified" @click="filterComponent.clearFilters()" prepend-icon="mdi-undo-variant">
                {{ t('defaultFilters') }}
              </v-btn>
            </div>
          </div>
        </v-alert> -->
        <div v-if="sortedProposals.length">
          <div v-for="p in sortedProposals" :key="p.pk">
            <Proposal :p="p" :comments="getProposalDiscussions(p)" v-intersect="{
                handler: proposalIntersect(p),
                options: { threshold: 1 }
              }">
              <template v-slot:buttons>
                <ReactionButton v-for="btn in proposalReactions" :key="btn.pk" :button="btn" :relation="{ content_type: 'proposal', object_id: p.pk }">{{ btn.title }}</ReactionButton>
              </template>
            </Proposal>
          </div>
        </div>
        <v-alert type="info" icon="mdi-filter-outline" v-else-if="hasProposals" class="mb-2">
          <div>
            <div class="mb-2">{{ t('agenda.helpNoProposalsInFilter') }}</div>
            <v-btn v-if="filterComponent && filterComponent.isModified" @click="filterComponent.clearFilters()" prepend-icon="mdi-undo-variant">
              {{ t('defaultFilters') }}
            </v-btn>
          </div>
        </v-alert>
        <v-alert icon="mdi-text-box-outline" v-else class="mb-2">
          {{ t('agenda.helpNoProposals') }}
        </v-alert>
        <AddContent v-if="proposalType.rules.canAdd(agendaItem)" :name="t('proposal.proposal')"
                    :handler="addProposal" :placeholder="t('proposal.postPlaceholder')"
                    :submitText="t('publish')" submitIcon="mdi-text-box-plus-outline"
                    ref="addProposalComponent" />
      </v-col>
      <v-col v-if="displayMode === 'columns'" cols="12" md="5" class="agenda-discussions">
        <h2>{{ t('discussion.discussions') }}</h2>
        <div class="btn-actions space-between mb-2">
          <v-btn @click="addDiscussionComponent.focus()" v-if="discussionPostType.rules.canAdd(agendaItem)" prepend-icon="mdi-plus" color="primary">
            {{ t('discussion.add') }}
          </v-btn>
        </div>
        <div v-if="sortedDiscussions.length" class="no-list">
          <DiscussionPost :p="d" v-for="d in sortedDiscussions" :key="d.pk">
            <template v-slot:buttons>
              <ReactionButton v-for="btn in discussionReactions" :key="btn.pk" :button="btn" :relation="{ content_type: 'discussion_post', object_id: d.pk }">{{ btn.title }}</ReactionButton>
            </template>
          </DiscussionPost>
        </div>
        <v-alert icon="mdi-comment-text-outline" v-else class="mb-2">
          {{ t('agenda.helpNoComments') }}
        </v-alert>
        <AddContent v-if="discussionPostType.rules.canAdd(agendaItem)" :name="t('discussion.discussion')"
                    :handler="addDiscussionPost" :placeholder="t('discussion.postPlaceholder')"
                    :submitText="t('post')" submitIcon="mdi-send" ref="addDiscussionComponent" />
      </v-col>
    </v-row>
  </template>
</template>

<script lang="ts">
import { ComponentPublicInstance, computed, ComputedRef, defineComponent, onMounted, onUnmounted, provide, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AddContent from '@/components/AddContent.vue'
import Headline from '@/components/Headline.vue'
import ProposalVue from '@/modules/proposals/Proposal.vue'
import { Filter } from './types'
import ReactionButton from '@/modules/reactions/ReactionButton.vue'
import Richtext from '@/components/Richtext.vue'
import WorkflowState from '@/components/WorkflowState.vue'
import DiscussionPostVue from '@/modules/discussions/DiscussionPost.vue'
import SpeakerList from '@/modules/speakerLists/SpeakerList.vue'

import useAgenda from '@/modules/agendas/useAgenda'
import useDiscussions from '@/modules/discussions/useDiscussions'
import useMeeting from '@/modules/meetings/useMeeting'
import useProposals from '@/modules/proposals/useProposals'
import useReactions from '@/modules/reactions/useReactions'
import useSpeakerLists from '@/modules/speakerLists/useSpeakerLists'

import agendaItemType from '@/contentTypes/agendaItem'
import discussionPostType from '@/contentTypes/discussionPost'
import pollType from '@/contentTypes/poll'
import proposalType from '@/contentTypes/proposal'
import speakerListType from '@/contentTypes/speakerList'
import { MenuItem } from '@/utils/types'
import { AgendaItem, DiscussionPost, Proposal } from '@/contentTypes/types'
import { SpeakerListState } from '@/contentTypes/speakerList/workflowStates'
import { DEFAULT_FILTER_STATES } from '@/contentTypes/proposal/workflowStates'
import { useStorage, useTitle } from '@vueuse/core'
import { LastReadKey } from '@/composables/useUnread'
import { TagsKey } from '@/modules/meetings/useTags'

import AgendaFilters from './AgendaFilters.vue'

// Store filters for each agenda id
const agendaFilters = reactive<Map<number, Filter>>(new Map())

export default defineComponent({
  name: 'AgendaItem',
  setup () {
    const { t } = useI18n()
    const discussions = useDiscussions()
    const proposals = useProposals()
    const { meetingPath, meetingId, meeting } = useMeeting()
    const { agendaId, agendaItem, hasNewItems, agendaItemLastRead } = useAgenda()
    const { getMeetingButtons } = useReactions()
    const channel = agendaItemType.getChannel()

    useTitle(computed(() => `${agendaItem.value?.title ?? t('agenda.item')} | ${meeting.value?.title ?? t('meeting')}`))

    const activeFilter = computed<Filter>({
      get: () => {
        if (!agendaFilters.has(agendaId.value)) {
          agendaFilters.set(agendaId.value, {
            order: 'created',
            states: new Set(DEFAULT_FILTER_STATES),
            tags: new Set()
          })
        }
        return agendaFilters.get(agendaId.value) as Filter
      },
      set: value => agendaFilters.set(agendaId.value, value)
    })
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
    // const hiddenUnreadProposals = computed(() => proposals.filterHidesUnread(agendaId.value, agendaItemLastRead.value, proposalFilter))

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
    const addProposalComponent = ref<null | ComponentPublicInstance<{ focus:() => void }>>(null)
    const addDiscussionComponent = ref<null | ComponentPublicInstance<{ focus:() => void }>>(null)
    async function addProposal (body: string) {
      await proposalType.getContentApi().add({
        agenda_item: agendaId.value,
        body
      })
    }
    async function addDiscussionPost (body: string) {
      await discussionPostType.getContentApi().add({
        agenda_item: agendaId.value,
        body
      })
    }

    const proposalReactions = computed(() => getMeetingButtons(meetingId.value, 'proposal'))
    const discussionReactions = computed(() => getMeetingButtons(meetingId.value, 'discussion_post'))

    const menuItems = computed<MenuItem[]>(() => {
      const items: MenuItem[] = []
      if (pollType.rules.canAdd(agendaItem.value)) {
        items.push({
          text: t('poll.new'),
          icon: 'mdi-star',
          to: `${meetingPath.value}/polls/new/${agendaId.value}`
        })
      }
      if (agendaItemType.rules.canChange(agendaItem.value)) {
        items.push({
          text: t('edit'),
          icon: 'mdi-pencil',
          onClick: async () => { editing.value = true }
        })
        items.push({
          text: t('plenary.view'),
          icon: 'mdi-gavel',
          to: `/p/${meetingId.value}/${agendaId.value}`
        })
      }
      const speakerSystems = getSystems(meetingId.value, false, true)
      if (speakerSystems.length) {
        items.push('---')
        for (const system of speakerSystems) {
          items.push({
            text: t('speaker.manageSystem', system as any),
            icon: 'mdi-bullhorn',
            to: `${meetingPath.value}/lists/${system.pk}/${agendaId.value}`
          })
        }
      }
      return items
    })

    const hasProposals = computed(() => proposals.agendaItemHasProposals(agendaId.value))

    // Register whether all proposals has been read
    // const proposalsRead = reactive<Set<number>>(new Set())
    // function proposalIntersect (p: Proposal) {
    //   return (isIntersecting: boolean) => {
    //     if (isIntersecting) proposalsRead.add(p.pk)
    //   }
    // }
    function setLastRead (ai: AgendaItem, force = false) {
      // Allow forcing read marker, on user demand
      if (force) return channel.send('last_read.change', { agenda_item: ai.pk })
      // Return if there is no new content
      if (!ai || !hasNewItems(ai)) return
      // Return if any unread proposals are unseen
      // for (const p of proposals.getAgendaProposals(ai.pk)) {
      //   if (p.created > agendaItemLastRead.value && !proposalsRead.has(p.pk)) return
      // }
      channel.send('last_read.change', {
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

    const filterComponent = ref<ComponentPublicInstance<{ setTag:(tag: string) => void, isModified: ComputedRef<boolean>, clearFilters: () => {} }> | null>(null)
    function clickHandler (evt: MouseEvent) {
      const tagElem = evt.composedPath().find(elem => (elem as HTMLElement).dataset?.denotationChar === '#') as HTMLElement | null
      // eslint-disable-next-line no-unused-expressions
      if (tagElem?.dataset.value && !tagElem.classList.contains('disabled')) filterComponent.value?.setTag(tagElem.dataset.value)
    }
    onMounted(() => {
      document.addEventListener('click', clickHandler)
    })
    onUnmounted(() => {
      document.removeEventListener('click', clickHandler)
    })

    const editing = ref(false)
    const content = reactive({
      title: agendaItem.value?.title,
      body: agendaItem.value?.body
    })
    function submit () {
      editing.value = false
      if (content.title === agendaItem.value?.title && content.body === agendaItem.value?.body) return
      channel.change(agendaId.value, { ...content })
    }

    provide(LastReadKey, agendaItemLastRead)
    provide(TagsKey, allTags)

    return {
      t,
      activeFilter,
      agendaId,
      agendaItem,
      addProposal,
      addDiscussionComponent,
      addProposalComponent,
      addDiscussionPost,
      content,
      // hiddenUnreadProposals,
      setLastRead,
      submit,
      ...discussions,
      discussionReactions,
      displayMode,
      editing,
      filterComponent,
      meetingPath,
      menuItems,
      proposalReactions,
      hasProposals,
      sortedProposals,
      sortedDiscussions,
      speakerLists,
      speakerSystems,

      agendaItemType,
      discussionPostType,
      pollType,
      proposalType,
      speakerListType,

      proposalIntersect: () => {}
      // agendaItemLastRead
    }
  },
  components: {
    AddContent,
    DiscussionPost: DiscussionPostVue,
    Headline,
    Proposal: ProposalVue,
    AgendaFilters,
    SpeakerList,
    Richtext,
    ReactionButton,
    WorkflowState
  }
})
</script>

<style lang="sass">
.agenda-proposals .proposal
  border-top: 1px solid rgb(var(--v-border-color))
  margin-top: 1em
  padding-top: 1em

.btn-actions.space-between
  display: flex
  justify-content: space-between

#agenda-display-mode
  margin-top: .5em
  text-align: right
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
    font-size: 14pt
  img
    width: 24px
    height: auto
</style>
