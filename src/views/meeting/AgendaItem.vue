<template>
  <div>
    <h1>{{ agendaItem.title }}</h1>
    <workflow-state v-if="agendaItem.state" :state="agendaItem.state" :admin="hasRole('moderator')" content-type="agenda_item" :pk="agendaId" />
    <btn v-if="hasRole('moderator')" sm icon="star" @click="$router.push(`${meetingPath}/polls/new/${agendaId}`)">New poll</btn>
    <div v-if="speakerLists.length">
      <h2>Speaker lists</h2>
      <div v-for="{ title, state, pk } in speakerLists" :key="pk">
        <h3>{{ title }}</h3>
        <p>{{ state }}</p>
        <div v-if="speakers.currentlySpeaking.value.get(pk)">
          Speaking: <user :pk="speakers.currentlySpeaking.value.get(pk)" />
        </div>
        <ol v-if="speakers.speakerQueues.value.get(pk)">
          <li v-for="userPk in speakers.speakerQueues.value.get(pk)" :key="userPk"><user :pk="userPk"/></li>
        </ol>
        <btn v-if="!speakers.userInList(pk)" icon="speaker_notes" @click="speakers.enterList(pk)">Enter list</btn>
        <btn v-else icon="speaker_notes_off" @click="speakers.leaveList(pk)">Leave list</btn>
      </div>
    </div>
    <div v-else>
      No speaker lists
    </div>
    <div class="row">
      <div class="col-sm-6">
        <h2>Proposals</h2>
        <ul v-if="sortedProposals.length" class="no-list">
          <li v-for="p in sortedProposals" :key="p.pk">
            <proposal :p="p"/>
          </li>
        </ul>
        <p v-else><em>Nothing to speak</em></p>
        <add-content v-if="hasRole('proposer')" name="proposal"
          :context-pk="agendaId" content-type="proposal"
          endpoint="proposals/" :params="{ agenda_item: agendaId }"/>
      </div>
      <div class="col-sm-6">
        <h2>Discussions</h2>
        <ul v-if="sortedDiscussions.length" class="no-list">
          <li v-for="d in sortedDiscussions" :key="d.pk">
            <discussion-post :p="d"/>
          </li>
        </ul>
        <p v-else><em>Nothing to hear</em></p>
        <add-content v-if="hasRole('discusser')" name="discussion post"
          :context-pk="agendaId" content-type="discussion_post"
          endpoint="discussion-posts/" :params="{ agenda_item: agendaId }"/>
      </div>
    </div>
  </div>
</template>

<script>
import AddContent from '@/components/meeting/AddContent.vue'
import WorkflowState from '@/components/widgets/WorkflowState.vue'
import Proposal from '@/components/widgets/Proposal.vue'
import DiscussionPost from '@/components/widgets/DiscussionPost.vue'

import useMeeting from '@/composables/meeting/useMeeting'
import useAgenda from '@/composables/meeting/useAgenda'
import useProposals from '@/composables/meeting/useProposals'
import useDiscussions from '@/composables/meeting/useDiscussions'
import useSpeakerLists from '@/composables/meeting/useSpeakerLists'
import useLoader from '@/composables/useLoader'
import useChannels from '@/composables/useChannels'
import { computed, onBeforeMount, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

export default {
  name: 'AgendaItem',
  setup () {
    const loader = useLoader('AgendaItem')
    const discussions = useDiscussions()
    const proposals = useProposals()
    const { hasRole, meetingPath } = useMeeting()
    const channel = useChannels('agenda_item')
      .onLeave(pk => {
        proposals.clearAgenda(pk)
        discussions.clearAgenda(pk)
      })

    const { agendaId, agendaItem } = useAgenda()

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

    watch(agendaId, (pk, oldPk) => {
      if (pk) {
        channel.subscribe(pk)
      }
      if (oldPk) {
        channel.leave(oldPk)
      }
    })

    onBeforeMount(_ => {
      loader.subscribe(channel, agendaId.value)
    })

    onBeforeRouteLeave((to, from, next) => {
      channel.leave(agendaId.value)
      next()
    })

    const speakers = useSpeakerLists()
    const speakerLists = computed(_ => speakers.getAgendaSpeakerLists(agendaId.value))

    return {
      hasRole,
      meetingPath,
      agendaId,
      agendaItem,
      sortedProposals,
      sortedDiscussions,
      speakerLists,
      speakers
    }
  },
  components: {
    AddContent,
    DiscussionPost,
    Proposal,
    WorkflowState
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
  li
    list-style: none
</style>
