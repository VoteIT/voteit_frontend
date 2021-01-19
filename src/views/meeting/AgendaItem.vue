<template>
  <div>
    <h1>{{ agendaItem.title }}</h1>
    <workflow-state v-if="agendaItem.state" :state="agendaItem.state" :admin="hasRole('moderator')" content-type="agenda_item" :pk="agendaId" />
    <btn v-if="hasRole('moderator')" sm icon="star" @click="$router.push(`${meetingPath}/polls/new/${agendaItem.pk}`)">New poll</btn>
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
          <li v-for="p in sortedDiscussions" :key="p.pk">
            <discussion-post :p="p"/>
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
import agendaStates from '@/schemas/agendaStates.json'

import AddContent from '@/components/meeting/AddContent.vue'
import WorkflowState from '@/components/widgets/WorkflowState.vue'
import Proposal from '@/components/widgets/Proposal.vue'
import DiscussionPost from '@/components/widgets/DiscussionPost.vue'

import useMeeting from '@/composables/meeting/useMeeting.js'
import useAgenda from '@/composables/meeting/useAgenda.js'
import useProposals from '@/composables/meeting/useProposals.js'
import useDiscussions from '@/composables/meeting/useDiscussions.js'
import useRestApi from '@/composables/useRestApi.js'
import useLoader from '@/composables/useLoader.js'
import useChannels from '@/composables/useChannels.js'

export default {
  name: 'AgendaItem',
  setup () {
    return {
      ...useMeeting(),
      ...useAgenda(),
      ...useProposals(),
      ...useDiscussions(),
      channel: useChannels('agenda_item'),
      loader: useLoader('AgendaItem'),
      restApi: useRestApi(),
      agendaStates
    }
  },
  components: {
    AddContent,
    DiscussionPost,
    Proposal,
    WorkflowState
  },
  computed: {
    agendaItem () {
      return this.getAgenda(this.meetingId).find(ai => ai.pk === this.agendaId) || {}
    },
    sortedProposals () {
      const proposals = this.getAgendaProposals(this.agendaId)
      proposals.sort((a, b) => {
        if (a.pk > b.pk) {
          return 1
        }
        if (a.pk < b.pk) {
          return -1
        }
        return 0
      })
      return proposals
    },
    sortedDiscussions () {
      return this.getAgendaDiscussions(this.agendaId)
    }
  },
  watch: {
    agendaId (newId, oldId) {
      if (oldId) {
        this.channel.leave(oldId)
      }
      if (newId) {
        this.channel.subscribe(newId)
      }
    }
  },
  created () {
    this.loader.subscribe(this.channel, this.agendaId)
  },
  beforeRouteLeave (to, from, next) {
    this.channel.leave(this.agendaId)
    next()
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
