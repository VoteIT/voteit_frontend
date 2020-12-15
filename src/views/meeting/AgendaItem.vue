<template>
  <div>
    <h1>{{ agendaItem.title }}</h1>
    <workflow-state v-if="agendaItem.state" :state="agendaItem.state" :all-states="agendaStates" :admin="hasRole('moderator')" :endpoint="`agenda-items/${agendaId}/`" />
    <btn v-if="hasRole('moderator')" sm icon="add" @click="$router.push(`${meetingPath}/polls/new/${agendaItem.pk}`)">New poll</btn>
    <div class="row">
      <div class="col-sm-6">
        <h2>Proposals</h2>
        <ul v-if="sortedProposals.length" class="no-list">
          <li v-for="p in sortedProposals" :key="p.pk">
            <proposal :p="p"/>
          </li>
        </ul>
        <p v-else><em>Nothing to speak</em></p>
        <add-content v-if="hasRole('proposer')" name="proposal" endpoint="proposals/" :params="{ agenda_item: this.agendaId }" />
      </div>
      <div class="col-sm-6">
        <h2>Discussions</h2>
        <ul v-if="sortedDiscussions.length" class="no-list">
          <li v-for="p in sortedDiscussions" :key="p.pk">
            <discussion-post :p="p"/>
          </li>
        </ul>
        <p v-else><em>Nothing to hear</em></p>
        <add-content v-if="hasRole('discusser')" name="discussion post" endpoint="discussion-posts/" :params="{ agenda_item: this.agendaId }" />
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
import useMeetingRoles from '@/composables/meeting/useMeetingRoles.js'
import useRestApi from '@/composables/useRestApi.js'
import useLoader from '@/composables/useLoader.js'
import useChannels from '@/composables/useChannels.js'

export default {
  name: 'AgendaItem',
  setup () {
    const { restApi } = useRestApi()
    const { fetch } = useLoader()
    return {
      ...useMeeting(),
      ...useMeetingRoles(),
      ...useAgenda(),
      ...useProposals(),
      ...useDiscussions(),
      ...useChannels(),
      fetch,
      restApi,
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
  methods: {
    initialize () {
      return Promise.all([
        this.fetchAgendaProposals(this.agendaId),
        this.fetchAgendaDiscussions(this.agendaId)
      ])
        .then(_ => {
          const userIds = [
            ...this.sortedProposals.map(p => p.author),
            ...this.sortedDiscussions.map(d => d.author)
          ]
          this.fetchMeetingRoles(userIds)
        })
    }
  },
  watch: {
    agendaId (newId, oldId) {
      if (oldId) {
        this.leave(`agenda_item/${oldId}`)
      }
      if (newId) {
        this.initialize()
        this.subscribe(`agenda_item/${newId}`)
      }
    }
  },
  created () {
    this.fetch(this.initialize)
    this.subscribe(`agenda_item/${this.agendaId}`)
  },
  beforeRouteLeave (to, from, next) {
    this.leave(`agenda_item/${this.agendaId}`)
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
