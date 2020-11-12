<template>
  <div class="hello">
    <h1>{{ meeting.title || 'Ladda möte' }}</h1>
    <button v-if="buttonProgress === null" @click="getWithProgress">Get with progress</button>
    <div v-else class="progress" :class="{ failed: failed }"><div class="bar" :style="{ width: `${buttonProgress * 100}%` }">
      {{ failed ? 'Failed' : '' }}
      {{ buttonProgress === 1 ? 'Done' : '' }}
    </div></div>
    <div id="agenda" v-if="meeting.title">
      <template v-for="group in aiGroups" :key="group.name">
        <h2>{{ group.title }}</h2>
        <ul class="ai">
          <li v-for="ai in aiType(group.name)" :key="ai.pk">{{ ai.title }}</li>
        </ul>
      </template>
    </div>
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
      aiGroups: AI_GROUPS,
      buttonProgress: null,
      failed: false
    }
  },
  methods: {
    aiType (type) {
      return this.agenda.filter(ai => ai.state === type)
    },
    getWithProgress () {
      this.buttonProgress = 0
      this.$objects.get()
        .onProgress(value => { this.buttonProgress = value })
        .then(this.loadMeeting)
        .catch(() => {
          this.failed = true
        })
        .finally(() => {
          setTimeout(() => {
            this.buttonProgress = null
            this.failed = false
          }, 2000)
        })
    },
    loadMeeting () {
      this.$objects.subscribe(`agenda/${this.id}`, this.updateAgenda)
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
          alert('failed loading meeting', err)
        })
    },
    ...mapMutations(['updateAgenda', 'updateMeeting'])
  },
  computed: {
    ...mapState(['agenda', 'meeting'])
  },
  beforeUnmount () {
    this.$objects.leave(`agenda/${this.id}`, this.updateAgenda)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="sass">
h3
  margin: 40px 0 0
ul
  list-style-type: none
  padding: 0

  li
    display: inline-block
    margin: 0 10px

#agenda
  text-align: left
  ul
    li
      display: list-item
      margin: 0
      padding: .3rem

.progress
  width: 400px
  border: 1px solid #444
  border-radius: 3px
  margin: 0 auto
  .bar
    background-color: #4b4
    height: 1.2em
    color: #fff
    transition: background-color .2s, width .1s
  &.failed .bar
    background-color: #b44

a
  color: #42b983
</style>
