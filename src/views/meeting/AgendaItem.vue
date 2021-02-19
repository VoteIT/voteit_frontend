<template>
  <div>
    <h1>{{ agendaItem.title }}</h1>
    <div class="btn-controls">
      <workflow-state v-if="agendaItem.state" :state="agendaItem.state" :admin="agendaRules.canChange(agendaItem)" content-type="agendaItem" :pk="agendaId" />
      <btn v-if="pollRules.canAdd(agendaItem)" sm icon="star" @click="$router.push(`${meetingPath}/polls/new/${agendaId}`)">{{ t('poll.new') }}</btn>
      <btn v-if="agendaRules.canChange(agendaItem)" sm :active="editingBody" icon="edit" @click="editingBody = !editingBody">{{ t('edit') }}</btn>
    </div>
    <richtext :key="agendaId" :editing="editingBody" :object="agendaItem" :channel="channel" @edit-done="editingBody = false" />
    <div class="spaker-lists" v-if="hasSpeakerSystems">
      <h2>{{ t('speaker.lists', speakerLists.length) }}</h2>
      <speaker-list :pk="pk" v-for="{ pk } in speakerLists" :key="pk" />
    </div>
    <div class="row">
      <div class="col-sm-6">
        <h2>{{ t('proposal.proposals') }}</h2>
        <ul v-if="sortedProposals.length" class="no-list">
          <li v-for="p in sortedProposals" :key="p.pk">
            <proposal :p="p"/>
          </li>
        </ul>
        <p v-else><em>{{ t('proposal.noProposals') }}</em></p>
        <add-content v-if="proposalRules.canAdd(agendaItem)" :name="t('proposal.proposal')"
          :context-pk="agendaId" content-type="proposal"/>
      </div>
      <div class="col-sm-6">
        <h2>{{ t('discussion.discussions') }}</h2>
        <ul v-if="sortedDiscussions.length" class="no-list">
          <li v-for="d in sortedDiscussions" :key="d.pk">
            <discussion-post :p="d"/>
          </li>
        </ul>
        <p v-else><em>{{ t('discussion.noDiscussions') }}</em></p>
        <add-content v-if="discussionRules.canAdd(agendaItem)" :name="t('discussion.discussion')"
          :context-pk="agendaId" content-type="discussionPost"/>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'

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
import useSpeakerLists from '@/composables/meeting/useSpeakerLists'

import agendaType from '@/contentTypes/agendaItem'
import discussionRules from '@/contentTypes/discussionPost/rules'
import pollRules from '@/contentTypes/poll/rules'
import proposalRules from '@/contentTypes/proposal/rules'

export default {
  name: 'AgendaItem',
  inject: ['t'],
  setup () {
    const discussions = useDiscussions()
    const proposals = useProposals()
    const { meetingPath, meetingId } = useMeeting()
    const { agendaId, agendaItem } = useAgenda()
    const channel = agendaType.useChannels()

    const sortedProposals = computed(_ => {
      const ps = proposals.getAgendaProposals(agendaId.value)
      ps.sort((a, b) => {
        if (a.pk > b.pk) {
          return 1
        }
        if (a.pk < b.pk) {
          return -1
        }
        return 0
      })
      return ps
    })

    const sortedDiscussions = computed(_ => discussions.getAgendaDiscussions(agendaId.value))
    const { getAgendaSpeakerLists, getSystems } = useSpeakerLists()
    const speakerLists = computed(_ => getAgendaSpeakerLists(agendaId.value))

    const hasSpeakerSystems = computed(_ => {
      return !!getSystems(meetingId.value).length
    })

    const editingBody = ref(false)

    return {
      meetingPath,
      agendaId,
      agendaItem,
      sortedProposals,
      sortedDiscussions,
      hasSpeakerSystems,
      speakerLists,
      channel,
      editingBody,

      proposalRules,
      discussionRules,
      pollRules,
      agendaRules: agendaType.rules
    }
  },
  components: {
    AddContent,
    DiscussionPost,
    Proposal,
    WorkflowState,
    SpeakerList,
    Richtext
  }
}
</script>

<style lang="sass">
/* Burn after reading */
.row
  display: flex
  flex-direction: row
  margin: 0 -10px
.col-sm-6
  width: calc(50% - 20px)
  margin: 0 10px

ul.no-list
  padding: 0
  > li
    list-style: none
</style>
