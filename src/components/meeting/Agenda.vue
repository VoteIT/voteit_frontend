<template>
  <div id="agenda">
    <template v-for="group in aiGroups" :key="group.name">
      <h2>{{ group.title }}</h2>
      <ul class="ai">
        <li v-for="ai in aiType(group.name)" :key="ai.pk"><router-link :to="aiPath(ai)">{{ ai.title }}</router-link></li>
      </ul>
    </template>
  </div>
</template>

<script>
import { mapMutations, mapState } from 'vuex'

const AI_GROUPS = [
  {
    name: 'ongoing',
    title: 'Pågående'
  },
  {
    name: 'upcoming',
    title: 'Kommande'
  },
  {
    name: 'closed',
    title: 'Avslutade'
  },
  {
    name: 'private',
    title: 'Privata'
  }
]

export default {
  name: 'Agenda',
  data () {
    return {
      id: Number(this.$route.params.id),
      aiGroups: AI_GROUPS
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
    agenda () {
      return this.agendas[this.id] || []
    },
    ...mapState('meetings', ['agendas'])
  },
  created () {
    this.$objects.subscribe(`meeting/${this.id}`, this.updateAgenda)
  },
  beforeUnmount () {
    this.$objects.leave(`meeting/${this.id}`, this.updateAgenda)
  }
}
</script>

<style lang="sass">
#agenda
  h2
    font-size: 1.2rem
    margin: .6em 0 0
  text-align: left
  ul
    margin: 0
    li
      display: list-item
      margin: 0
      padding: .3rem

</style>
