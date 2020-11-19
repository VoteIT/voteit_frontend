<template>
  <div>
    <h1>{{ ai.title }}</h1>
    <h2>Proposals</h2>
    <ul>
      <li v-for="p in sortedProposals" :key="p.pk">
        {{ p.title }}
      </li>
    </ul>
    <button @click="proposalMode = !proposalMode">{{ proposalMode ? '-' : '+' }} Add proposal</button>
    <form @submit.prevent="sendProposal" v-show="proposalMode">
      <label for="p_title">Write your proposal</label>
      <input id="p_title" name="title" type="text" required v-model="proposal.title" />
      <input type="submit" value="Submit proposal" :disabled="proposalSubmitting" />
    </form>
  </div>
</template>

<script>
import { mapGetters, mapMutations, mapState } from 'vuex'

export default {
  name: 'AgendaItem',
  data () {
    return {
      proposalMode: false,
      proposalSubmitting: false,
      proposal: {
        title: ''
      }
    }
  },
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
    sendProposal () {
      if (this.proposalSubmitting) {
        return
      }
      const data = Object.assign({}, this.proposal, { agenda_item: this.id })
      this.proposalSubmitting = true
      this.$api.post('proposals/', data)
        .then(() => {
          this.proposal.title = ''
          this.proposalMode = false
        })
        .catch(alert)
        .finally(() => {
          this.proposalSubmitting = false
        })
    },
    initialize () {
      const params = { agenda_item: this.id }
      this.$api.get('proposals/', { params })
        .then(({ data }) => {
          this.setProposals({
            ai: this.id,
            proposals: data
          })
        })
    },
    ...mapMutations('proposals', ['setProposals', 'updateProposal'])
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
