<template>
  <div id="agenda">
    <template v-for="s in aiGroups" :key="s.state">
      <h2><icon sm :name="s.icon" /> {{ s.state }}</h2>
      <ul class="ai">
        <li v-for="ai in aiType(s.state)" :key="ai.pk"><router-link :to="aiPath(ai)">{{ ai.title }}</router-link></li>
      </ul>
    </template>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import agendaStates from '@/schemas/agendaStates.json'

const AI_ORDER = ['ongoing', 'upcoming', 'closed', 'private']

export default {
  name: 'Agenda',
  data () {
    return {
      id: Number(this.$route.params.id)
    }
  },
  methods: {
    aiPath (ai) {
      return `/m/${this.id}/${this.$route.params.slug}/a/${ai.pk}/${this.$slugify(ai.title)}`
    },
    aiType (type) {
      return this.agenda.filter(ai => ai.state === type)
    },
    ...mapMutations('meetings', ['updateAgenda'])
  },
  computed: {
    aiGroups () {
      return AI_ORDER.map(state => agendaStates.find(s => s.state === state))
    },
    agenda () {
      return this.getAgenda(this.id)
    },
    ...mapGetters('meetings', ['getAgenda'])
  },
  created () {
    this.$objects.subscribe(`meeting/${this.id}`, this)
  },
  beforeUnmount () {
    this.$objects.leave(`meeting/${this.id}`, this)
  }
}
</script>

<style lang="sass">
#agenda
  h2
    font-size: 1.2rem
    margin: .6em 0
    border-top: 1px solid #ddd
    line-height: 2
    text-transform: capitalize
    .material-icons
      color: #999
      vertical-align: text-bottom
  ul
    margin: 0
    padding: 0
    li
      margin: 0
      padding: .3rem
      font-size: 1.2rem
    a
      text-decoration: none
      padding: .4rem 1.3rem
</style>
