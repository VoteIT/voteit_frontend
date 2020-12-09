<template>
  <div>
    <h1>{{ ai.title }}</h1>
    <workflow-state v-if="ai.state" :state="ai.state" :all-states="agendaStates" :admin="hasRole('moderator')" :endpoint="`agenda-items/${id}/transitions/`" />
    <div class="row">
      <div class="col-sm-6">
        <h2>Proposals</h2>
        <ul v-if="sortedProposals.length">
          <li v-for="p in sortedProposals" :key="p.pk">
            {{ getUser(p.author, meetingId).full_name }}:<br />
            {{ p.title }}
            <icon name="delete" button sm @click="$api.delete(`proposals/${p.pk}/`)" />
          </li>
        </ul>
        <p v-else><em>Nothing to speak</em></p>
        <add-content name="proposal" endpoint="proposals/" :params="{ agenda_item: this.id }" />
      </div>
      <div class="col-sm-6">
        <h2>Discussions</h2>
        <ul v-if="sortedDiscussions.length">
          <li v-for="d in sortedDiscussions" :key="d.pk">
            {{ getUser(d.author, meetingId).full_name }}:<br />
            {{ d.title }}
            <icon name="delete" button sm @click="$api.delete(`discussion-posts/${d.pk}/`)" />
          </li>
        </ul>
        <p v-else><em>Nothing to hear</em></p>
        <add-content name="discussion post" endpoint="discussion-posts/" :params="{ agenda_item: this.id }" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import agendaStates from '@/schemas/agendaStates.json'

import AddContent from './AddContent.vue'
import WorkflowState from '../WorkflowState.vue'

export default {
  name: 'AgendaItem',
  components: {
    AddContent,
    WorkflowState
  },
  computed: {
    agendaStates () {
      return agendaStates
    },
    meeting () {
      return this.getMeeting(this.meetingId)
    },
    meetingId () {
      return Number(this.$route.params.id)
    },
    id () {
      return Number(this.$route.params.aid)
    },
    agenda () {
      return this.getAgenda(this.meetingId)
    },
    ai () {
      return this.agenda.find(ai => ai.pk === this.id) || {}
    },
    sortedProposals () {
      return this.agendaProposals(this.id)
    },
    sortedDiscussions () {
      return this.agendaDiscussions(this.id)
    },
    ...mapState(['proposals']),
    ...mapGetters('proposals', ['agendaProposals']),
    ...mapGetters('discussions', ['agendaDiscussions']),
    ...mapGetters('meetings', ['getUser', 'getMeeting', 'getAgenda'])
  },
  methods: {
    hasRole (roleName) {
      return this.meeting.current_user_roles.includes(roleName)
    },
    initialize () {
      const params = { agenda_item: this.id }
      return Promise.all([
        this.$api.get('proposals/', { params })
          .then(({ data }) => {
            this.setProposals({
              ai: this.id,
              proposals: data
            })
            this.fetchMeetingRoles({
              meetingId: this.meetingId,
              userIds: data.map(p => p.author)
            })
          }),
        this.$api.get('discussion-posts/', { params })
          .then(({ data }) => {
            this.setDiscussions({
              ai: this.id,
              discussions: data
            })
            this.fetchMeetingRoles({
              meetingId: this.meetingId,
              userIds: data.map(d => d.author)
            })
          })
      ])
    },
    ...mapMutations('proposals', ['setProposals', 'updateProposal']),
    ...mapMutations('discussions', ['setDiscussions', 'updateDiscussion']),
    ...mapActions('meetings', ['fetchMeetingRoles'])
  },
  watch: {
    id (newId, oldId) {
      if (oldId) {
        this.$channels.leave(`agenda_item/${oldId}`, this)
      }
      if (newId) {
        this.initialize()
        this.$channels.subscribe(`agenda_item/${newId}`, this)
      }
    }
  },
  created () {
    this.$channels.subscribe(`agenda_item/${this.id}`, this)
  },
  beforeUnmount () {
    if (this.id) {
      this.$channels.leave(`agenda_item/${this.id}`, this)
    }
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
</style>
