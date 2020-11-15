<template>
  <div id="meeting">
    <router-link to="/">Hem</router-link>
    <h1>{{ meeting.title || 'Ladda möte' }}</h1>
    <div v-if="!progress">
      <button @click="countToTen(true)">Count to 10</button>
      <button @click="countToTen(false)">Fail at 5</button>
      <button @click="countToTen(true, { timeout: 500 })">Short timeout</button>
    </div>
    <div v-else class="progress" :class="{ failed: state === false, done: state }"><div class="bar" :style="{ width: `${progress.curr / progress.total * 100}%` }">
      <span>{{ progressText }}</span>
    </div></div>
    <agenda v-if="agenda.length" />
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
import Agenda from '@/components/meeting/Agenda'

export default {
  name: 'Meeting',
  props: {
    msg: String
  },
  components: {
    Agenda
  },
  data () {
    return {
      id: Number(this.$route.params.id),
      progress: null,
      state: null
    }
  },
  methods: {
    countToTen (succeed, config) {
      const data = succeed ? undefined : { fail: 5 }
      this.$objects.post('testing.count', data, config)
        .onProgress(value => {
          this.progress = value
        })
        .then(({ p }) => {
          this.progress = p
          this.state = true
        })
        .catch(() => {
          this.state = false
          this.progress = {
            curr: 1,
            total: 1
          }
        })
        .finally(() => {
          setTimeout(() => {
            this.progress = null
            this.state = null
          }, 2000)
        })
    },
    loadMeeting () {
      this.$api.get(`meetings/${this.id}/`)
        .then(({ data }) => {
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
    ...mapMutations('meetings', ['updateAgenda', 'updateMeeting'])
  },
  computed: {
    progressText () {
      switch (this.state) {
        case true:
          return 'Coming to get you!'
        case false:
          return 'Failed'
        default:
          return this.progress.curr
      }
    },
    meeting () {
      return this.meetings[this.id] || {}
    },
    agenda () {
      return this.agendas[this.id] || []
    },
    ...mapState('meetings', ['meetings', 'agendas'])
  },
  created () {
    this.loadMeeting()
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

.progress
  width: 400px
  border: 1px solid #444
  border-radius: 3px
  margin: 0 auto
  .bar
    box-sizing: border-box
    background-color: #ddd
    height: 1.2em
    color: #000
    transition: background-color .2s, width .1s
    text-align: left
    span
      padding: .1em .4em
      display: inline-block
  &.failed .bar
    background-color: #b44
    color: #fff
  &.done .bar
    background-color: #4b4
    color: #fff

a
  color: #42b983
</style>
