<template>
  <template v-if="agendaItem">
    <v-row>
      <v-col>
        <div id="agenda-display-mode">
          <span class="text-secondary">{{ t('agenda.showAs') }}</span>
          <v-btn plain :title="t(`agenda.${mode}`)" v-for="mode in ['columns', 'nested']" :key="mode" :class="{ active: displayMode === mode }" @click="displayMode = mode">
            <img :src="require(`@/assets/agenda-display-${mode}.svg`)"/>
          </v-btn>
        </div>
        <Menu float :items="menuItems" :show-transitions="agendaItemType.rules.canChange(agendaItem)" :content-type="agendaItemType" :content-pk="agendaId" />
        <h1>{{ agendaItem.title }}</h1>
        <Richtext :key="agendaId" :editing="editingBody" :object="agendaItem" :channel="channel" @edit-done="editingBody = false" />
        <div class="speaker-lists" v-if="speakerSystems.length">
          <h2>{{ t('speaker.lists', speakerLists.length) }}</h2>
          <v-btn style="margin-right: .5em; margin-bottom: .5em;" size="small" v-for="system in addSpeakerSystems" :key="system.pk" @click="addSpeakerList(system)"><v-icon left icon="mdi-plus"/>{{ t('speaker.addListToSystem', system) }}</v-btn>
          <SpeakerList :list="list" v-for="list in speakerLists" :key="list.pk" />
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" :lg="displayMode === 'columns' ? 7 : 8" class="agenda-proposals">
        <h2 v-if="displayMode === 'columns'">{{ t('proposal.proposals') }}</h2>
        <h2 v-else>{{ t('proposal.proposalsAndComments') }}</h2>
        <div v-if="sortedProposals.length">
          <div v-for="p in sortedProposals" :key="p.pk">
            <Proposal :p="p" :all-tags="allTags" :comments="getProposalDiscussions(p)" :unread="p.created > agendaItemLastRead" v-intersect="{
                handler: proposalIntersect(p),
                options: { threshold: 1 }
              }">
              <template v-slot:buttons>
                <ReactionButton v-for="btn in proposalReactions" :key="btn.pk" :button="btn" :relation="{ content_type: 'proposal', object_id: p.pk }">{{ btn.title }}</ReactionButton>
              </template>
            </Proposal>
          </div>
        </div>
        <p v-else><em>{{ t('proposal.noProposals') }}</em></p>
        <AddContent v-if="proposalType.rules.canAdd(agendaItem)" :name="t('proposal.proposal')"
                    :tags="allTags" :handler="addProposal" />
      </v-col>
      <v-col v-if="displayMode === 'columns'" cols="12" lg="5" class="agenda-discussions">
        <h2>{{ t('discussion.discussions') }}</h2>
        <div v-if="sortedDiscussions.length" class="no-list">
          <DiscussionPost :p="d" :all-tags="allTags" v-for="d in sortedDiscussions" :key="d.pk">
            <template v-slot:buttons>
              <ReactionButton v-for="btn in discussionReactions" :key="btn.pk" :button="btn" :relation="{ content_type: 'discussion_post', object_id: d.pk }">{{ btn.title }}</ReactionButton>
            </template>
          </DiscussionPost>
        </div>
        <p v-else><em>{{ t('discussion.noDiscussions') }}</em></p>
        <AddContent v-if="discussionPostType.rules.canAdd(agendaItem)" :name="t('discussion.discussion')"
                    :tags="allTags" :handler="addDiscussionPost" />
      </v-col>
    </v-row>
  </template>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { orderBy } from '@/utils'

import AddContent from '@/components/meeting/AddContent.vue'
import DiscussionPost from '@/components/widgets/DiscussionPost.vue'
import ProposalVue from '@/components/widgets/Proposal.vue'
import ReactionButton from '@/components/meeting/ReactionButton.vue'
import Richtext from '@/components/widgets/Richtext.vue'
import SpeakerList from '@/components/widgets/SpeakerList.vue'

import useAgenda, { agendaItemsLastRead } from '@/composables/meeting/useAgenda'
import useDiscussions from '@/composables/meeting/useDiscussions'
import useMeeting from '@/composables/meeting/useMeeting'
import useProposals from '@/composables/meeting/useProposals'
import useReactions from '@/composables/meeting/useReactions'
import useSpeakerLists from '@/composables/meeting/useSpeakerLists'

import agendaItemType from '@/contentTypes/agendaItem'
import discussionPostType from '@/contentTypes/discussionPost'
import pollType from '@/contentTypes/poll'
import proposalType from '@/contentTypes/proposal'
import { SpeakerSystem } from '@/contentTypes/speakerSystem'
import speakerListType from '@/contentTypes/speakerList'
import { SpeakerListAddMessage } from '@/contentTypes/messages'
import { MenuItem } from '@/utils/types'
import { AgendaItem, Proposal } from '@/contentTypes/types'

export default defineComponent({
  name: 'AgendaItem',
  setup () {
    const { t } = useI18n()
    const router = useRouter()
    const discussions = useDiscussions()
    const proposals = useProposals()
    const { meetingPath, meetingId } = useMeeting()
    const { agendaId, agendaItem, hasNewItems, agendaItemLastRead } = useAgenda()
    const { getMeetingButtons } = useReactions()
    const channel = agendaItemType.getChannel()

    const sortedProposals = computed(() => {
      const ps = proposals.getAgendaProposals(agendaId.value)
      return orderBy(ps)
    })

    const sortedDiscussions = computed(() => discussions.getAgendaDiscussions(agendaId.value))
    const { getAgendaSpeakerLists, getSystems } = useSpeakerLists()
    const speakerLists = computed(() => getAgendaSpeakerLists(agendaId.value))
    const speakerSystems = computed(() => getSystems(meetingId.value))

    const editingBody = ref(false)
    const displayMode = ref(localStorage.agendaDisplayMode ?? 'columns')
    watch(displayMode, value => {
      localStorage.agendaDisplayMode = value
    })

    const allTags = computed<Set<string>>(() => {
      const tags = new Set<string>()
      for (const p of sortedProposals.value) {
        p.tags.forEach(t => tags.add(t))
      }
      for (const d of sortedDiscussions.value) {
        d.tags.forEach(d => tags.add(d))
      }
      return tags
    })
    function addProposal (body: string) {
      return proposalType.getContentApi().add({
        agenda_item: agendaId.value,
        body
      })
    }
    function addDiscussionPost (body: string) {
      return discussionPostType.getContentApi().add({
        agenda_item: agendaId.value,
        body
      })
    }

    const proposalReactions = computed(() => getMeetingButtons(meetingId.value, 'proposal'))
    const discussionReactions = computed(() => getMeetingButtons(meetingId.value, 'discussion_post'))

    function addSpeakerList (system: SpeakerSystem) {
      const listData: SpeakerListAddMessage = {
        title: agendaItem.value?.title ?? '---',
        speaker_system: system.pk,
        agenda_item: agendaId.value
      }
      speakerListType.getContentApi().add(listData)
    }

    const addSpeakerSystems = computed(() => speakerSystems.value.filter(system => speakerListType.rules.canAdd(system)))

    const menuItems = computed<MenuItem[]>(() => {
      const items: MenuItem[] = []
      if (pollType.rules.canAdd(agendaItem.value)) {
        items.push({
          text: t('poll.new'),
          icon: 'mdi-star',
          onClick: async () => { router.push(`${meetingPath.value}/polls/new/${agendaId.value}`) }
        })
      }
      if (agendaItemType.rules.canChange(agendaItem.value)) {
        items.push({
          text: t('edit'),
          icon: 'mdi-pencil',
          onClick: async () => { editingBody.value = !editingBody.value }
        })
      }
      return items
    })

    // Register whether all proposals has been read
    const proposalsRead = reactive<Set<number>>(new Set())
    function proposalIntersect (p: Proposal) {
      return (isIntersecting: boolean) => {
        if (isIntersecting) proposalsRead.add(p.pk)
      }
    }
    function setLastRead (agendaItem: AgendaItem) {
      // Return if there is no new content
      if (!hasNewItems(agendaItem)) return
      // Return if any unread proposals are unseen
      const lastRead = agendaItemsLastRead.get(agendaItem.pk) ?? new Date(0) // Default to epoch
      for (const p of proposals.getAgendaProposals(agendaItem.pk)) {
        if (p.created > lastRead && !proposalsRead.has(p.pk)) return
      }
      channel.send('last_read.change', {
        agenda_item: agendaItem.pk
      })
    }
    watch(agendaItem, (value, oldValue) => {
      // When leaving agenda item
      if (oldValue) setLastRead(oldValue)
    })

    return {
      t,
      addSpeakerSystems,
      agendaId,
      agendaItem,
      allTags,
      addProposal,
      addDiscussionPost,
      channel,
      ...discussions,
      displayMode,
      editingBody,
      meetingPath,
      menuItems,
      proposalReactions,
      discussionReactions,
      sortedProposals,
      sortedDiscussions,
      speakerLists,
      speakerSystems,
      addSpeakerList,

      agendaItemType,
      discussionPostType,
      pollType,
      proposalType,
      speakerListType,

      proposalIntersect,
      agendaItemLastRead
    }
  },
  components: {
    AddContent,
    DiscussionPost,
    Proposal: ProposalVue,
    SpeakerList,
    Richtext,
    ReactionButton
  }
})
</script>

<style lang="sass">
.agenda-proposals .proposal
  border-top: 1px solid rgb(var(--v-border-color))
  margin-top: 1em
  padding-top: 1em

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
