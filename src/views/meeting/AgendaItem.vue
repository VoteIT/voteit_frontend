<template>
  <v-container v-if="agendaItem">
    <v-row>
      <v-col>
        <h1>{{ agendaItem.title }}</h1>
        <div class="btn-controls">
          <WorkflowState v-if="agendaItem.state" :state="agendaItem.state" :admin="agendaItemType.rules.canChange(agendaItem)" :content-type="agendaItemType" :pk="agendaId" />
          <btn v-if="pollType.rules.canAdd(agendaItem)" sm icon="mdi-star" @click="$router.push(`${meetingPath}/polls/new/${agendaId}`)">{{ t('poll.new') }}</btn>
          <btn v-if="agendaItemType.rules.canChange(agendaItem)" sm :active="editingBody" icon="mdi-pencil" @click="editingBody = !editingBody">{{ t('edit') }}</btn>
        </div>
        <Richtext :key="agendaId" :editing="editingBody" :object="agendaItem" :channel="channel" @edit-done="editingBody = false" />
        <div class="speaker-lists" v-if="speakerSystems.length">
          <h2>{{ t('speaker.lists', speakerLists.length) }}</h2>
          <v-btn style="margin-right: .5em; margin-bottom: .5em;" size="small" v-for="system in addSpeakerSystems" :key="system.pk" @click="addSpeakerList(system)"><v-icon left icon="mdi-plus"/>{{ t('speaker.addListToSystem', system) }}</v-btn>
          <SpeakerList :list="list" v-for="list in speakerLists" :key="list.pk" />
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <h2>{{ t('proposal.proposals') }}</h2>
        <ul v-if="sortedProposals.length" class="no-list">
          <li v-for="p in sortedProposals" :key="p.pk">
            <Proposal :p="p">
              <template v-slot:buttons>
                <ReactionButton v-for="btn in proposalReactions" :key="btn.pk" :button="btn" :relation="{ content_type: 'proposal', object_id: p.pk }">{{ btn.title }}</ReactionButton>
              </template>
            </Proposal>
          </li>
        </ul>
        <p v-else><em>{{ t('proposal.noProposals') }}</em></p>
        <AddContent v-if="proposalType.rules.canAdd(agendaItem)" :name="t('proposal.proposal')"
                    :tags="allTags" :handler="addProposal" />
      </v-col>
      <v-col>
        <h2>{{ t('discussion.discussions') }}</h2>
        <ul v-if="sortedDiscussions.length" class="no-list">
          <li v-for="d in sortedDiscussions" :key="d.pk">
            <DiscussionPost :p="d">
              <template v-slot:buttons>
                <ReactionButton v-for="btn in discussionReactions" :key="btn.pk" :button="btn" :relation="{ content_type: 'discussion_post', object_id: d.pk }">{{ btn.title }}</ReactionButton>
              </template>
            </DiscussionPost>
          </li>
        </ul>
        <p v-else><em>{{ t('discussion.noDiscussions') }}</em></p>
        <AddContent v-if="discussionPostType.rules.canAdd(agendaItem)" :name="t('discussion.discussion')"
                    :tags="allTags" :handler="addDiscussionPost" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'

import { openAlertEvent, orderBy } from '@/utils'

import AddContent from '@/components/meeting/AddContent.vue'
import DiscussionPost from '@/components/widgets/DiscussionPost.vue'
import Proposal from '@/components/widgets/Proposal.vue'
import Richtext from '@/components/widgets/Richtext.vue'
import SpeakerList from '@/components/widgets/SpeakerList.vue'
import WorkflowState from '@/components/widgets/WorkflowState.vue'

import useAgenda from '@/composables/meeting/useAgenda'
import useDiscussions from '@/composables/meeting/useDiscussions'
import useMeeting from '@/composables/meeting/useMeeting'
import useProposals from '@/composables/meeting/useProposals'
import useReactions from '@/composables/meeting/useReactions'
import useSpeakerLists from '@/composables/meeting/useSpeakerLists'

import agendaItemType from '@/contentTypes/agendaItem'
import discussionPostType from '@/contentTypes/discussionPost'
import pollType from '@/contentTypes/poll'
import proposalType from '@/contentTypes/proposal'
import speakerListType from '@/contentTypes/speakerList'
import { SpeakerSystem } from '@/contentTypes/types'
import { SpeakerListAddMessage } from '@/contentTypes/messages'
import ReactionButton from '@/components/meeting/ReactionButton.vue'

export default defineComponent({
  name: 'AgendaItem',
  inject: ['t'],
  setup () {
    const discussions = useDiscussions()
    const proposals = useProposals()
    const { meetingPath, meetingId } = useMeeting()
    const { agendaId, agendaItem } = useAgenda()
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
      openAlertEvent.emit('Not Implemented')
      const listData: SpeakerListAddMessage = {
        title: agendaItem.value?.title ?? '---',
        speaker_system: system.pk,
        agenda_item: agendaId.value
      }
      speakerListType.getContentApi().add(listData)
    }

    const addSpeakerSystems = computed(() => speakerSystems.value.filter(system => speakerListType.rules.canAdd(system)))

    return {
      addSpeakerSystems,
      agendaId,
      agendaItem,
      allTags,
      addProposal,
      addDiscussionPost,
      channel,
      editingBody,
      meetingPath,
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
      speakerListType
    }
  },
  components: {
    AddContent,
    DiscussionPost,
    Proposal,
    WorkflowState,
    SpeakerList,
    Richtext,
    ReactionButton
  }
})
</script>

<style lang="sass">
ul.no-list
  padding: 0 !important
  > li
    list-style: none
</style>
