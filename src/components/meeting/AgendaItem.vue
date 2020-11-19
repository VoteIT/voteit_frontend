<template>
  <div>
    <h1>{{ ai.title }}</h1>
    <icon v-for="s in stateIcons" :title="s.transition"
      :key="s.state" :name="s.icon" :active="s.state === ai.state" button sm
      @click="$api.post(`agenda-items/${id}/transitions/`, { name: s.transition })" />
    <div class="row">
      <div class="col-sm-6">
        <h2>Proposals</h2>
        <ul v-if="sortedProposals.length">
          <li v-for="p in sortedProposals" :key="p.pk">
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
import { mapGetters, mapMutations, mapState } from 'vuex'

import AddContent from './AddContent'

const STATE_ICONS = [
  {
    transition: 'unpublish',
    icon: 'visibility_off',
    state: 'private'
  },
  {
    transition: 'upcoming',
    icon: 'pause',
    state: 'upcoming'
  },
  {
    transition: 'ongoing',
    icon: 'play_arrow',
    state: 'ongoing'
  },
  {
    transition: 'close',
    icon: 'close',
    state: 'closed'
  },
  {
    transition: 'archive',
    icon: 'archive',
    state: 'archived'
  }
]

export default {
  name: 'AgendaItem',
  components: {
    AddContent
  },
  computed: {
    stateIcons () {
      return STATE_ICONS
    },
    id () {
      return Number(this.$route.params.aid)
    },
    agenda () {
      return this.agendas[this.$route.params.id] || []
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
    ...mapState('meetings', ['agendas']),
    ...mapState(['proposals']),
    ...mapGetters('proposals', ['agendaProposals']),
    ...mapGetters('discussions', ['agendaDiscussions'])
  },
  methods: {
    initialize () {
      const params = { agenda_item: this.id }
      this.$api.get('proposals/', { params })
        .then(({ data }) => {
          this.setProposals({
            ai: this.id,
            proposals: data
          })
        })
      this.$api.get('discussion-posts/', { params })
        .then(({ data }) => {
          this.setDiscussions({
            ai: this.id,
            discussions: data
          })
        })
    },
    ...mapMutations('proposals', ['setProposals', 'updateProposal']),
    ...mapMutations('discussions', ['setDiscussions', 'updateDiscussion'])
  },
  watch: {
    id (newId, oldId) {
      if (oldId) {
        this.$objects.leave(`agenda_item/${oldId}`, this)
      }
      if (newId) {
        this.initialize()
        this.$objects.subscribe(`agenda_item/${newId}`, this)
      }
    }
  },
  created () {
    this.$objects.subscribe(`agenda_item/${this.id}`, this)
  },
  beforeUnmount () {
    if (this.id) {
      this.$objects.leave(`agenda_item/${this.id}`, this)
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
