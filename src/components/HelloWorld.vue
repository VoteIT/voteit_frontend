<template>
  <div class="hello">
    <h1>{{ meeting.title || 'Laddar möte' }}</h1>
    <template v-for="group in aiGroups" :key="group.name">
      <h2>{{ group.title }}</h2>
      <ul class="ai">
        <li v-for="ai in aiType(group.name)" :key="ai.pk">{{ ai.title }}</li>
      </ul>
    </template>
    <h3>Installed CLI Plugins</h3>
    <ul>
      <li><a href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-babel" target="_blank" rel="noopener">babel</a></li>
      <li><a href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-pwa" target="_blank" rel="noopener">pwa</a></li>
      <li><a href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-router" target="_blank" rel="noopener">router</a></li>
      <li><a href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-vuex" target="_blank" rel="noopener">vuex</a></li>
      <li><a href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-eslint" target="_blank" rel="noopener">eslint</a></li>
    </ul>
    <h3>Ecosystem</h3>
    <ul>
      <li><a href="https://router.vuejs.org" target="_blank" rel="noopener">vue-router</a></li>
      <li><a href="https://vuex.vuejs.org" target="_blank" rel="noopener">vuex</a></li>
      <li><a href="https://github.com/vuejs/vue-devtools#vue-devtools" target="_blank" rel="noopener">vue-devtools</a></li>
      <li><a href="https://vue-loader.vuejs.org" target="_blank" rel="noopener">vue-loader</a></li>
      <li><a href="https://github.com/vuejs/awesome-vue" target="_blank" rel="noopener">awesome-vue</a></li>
    </ul>
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
  name: 'HelloWorld',
  props: {
    msg: String
  },
  data () {
    return {
      id: 1, // Get from $route, probably
      aiGroups: AI_GROUPS
    }
  },
  methods: {
    aiType (type) {
      return this.agenda.filter(ai => ai.state === type)
    },
    ...mapMutations(['updateAgenda', 'updateMeeting'])
  },
  computed: {
    ...mapState(['agenda', 'meeting'])
  },
  created () {
    this.$subscribeObject(`agenda/${this.id}`, this.updateAgenda)
    this.$api.get(`meetings/${this.id}/`)
      .then(({ data }) => {
        console.log('loaded meeting', data)
        this.updateMeeting(data)
        this.updateAgenda({
          t: 'agenda.changed',
          p: {
            items: data.agenda_items
          }
        })
      })
      .catch(err => {
        console.log('failed loading meeting', err)
      })
  },
  beforeUnmount () {
    this.$leaveObject(`agenda/${this.id}`, this.updateAgenda)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="sass">
h3
  margin: 40px 0 0
ul:not(.ai)
  list-style-type: none
  padding: 0

  li
    display: inline-block
    margin: 0 10px
a
  color: #42b983
</style>
