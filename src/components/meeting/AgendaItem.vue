<template>
  <div>
    <h1>{{ ai.title }}</h1>
    <h2>Proposals</h2>
    <ul>
      <li v-for="p in sortedProposals" :key="p.pk">
        {{ p.title }}
      </li>
    </ul>
  </div>
</template>

<script>
import { mapGetters, mapMutations, mapState } from 'vuex'

export default {
  name: 'AgendaItem',
  computed: {
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
    ...mapState('meetings', ['agendas']),
    ...mapState(['proposals']),
    ...mapGetters('proposals', ['agendaProposals'])
  },
  methods: {
    fetchProposals () {
      const params = { agenda_item: this.id }
      this.$api.get('proposals/', { params })
        .then(({ data }) => {
          this.setProposals(data)
        })
    },
    ...mapMutations('proposals', ['setProposals', 'updateProposal'])
  },
  watch: {
    id (newId, oldId) {
      if (oldId) {
        this.$objects.leave(`agenda_item/${oldId}`, this.updateProposal)
      }
      if (newId) {
        this.fetchProposals()
        this.$objects.subscribe(`agenda_item/${newId}`, this.updateProposal)
      }
    }
  },
  created () {
    this.fetchProposals()
    this.$objects.subscribe(`agenda_item/${this.id}`, this.updateProposal)
  },
  beforeUnmount () {
    if (this.id) {
      this.$objects.leave(`agenda_item/${this.id}`, this.updateProposal)
    }
  }
}
</script>
