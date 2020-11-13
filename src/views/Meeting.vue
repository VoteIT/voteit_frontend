<template>
  <div id="meeting">
    <router-link to="/">Hem</router-link>
    <h1>{{ meeting.title || 'Ladda möte' }}</h1>
    <button v-if="buttonProgress === null" @click="getWithProgress">Get with progress</button>
    <div v-else class="progress" :class="{ failed: failed, done: buttonProgress === 1 }"><div class="bar" :style="{ width: `${buttonProgress * 100}%` }">
      {{ progressText }}
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
      buttonProgress: null,
      failed: false
    }
  },
  methods: {
    getWithProgress () {
      this.buttonProgress = 0
      this.$objects.get('agenda/1') // Does nothing, but slowly
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
      if (this.failed) {
        return 'Failed'
      }
      if (this.buttonProgress === 1) {
        return 'Done!'
      }
      return `${Math.floor(this.buttonProgress * 100)} %`
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
    background-color: #4b4
    height: 1.2em
    color: #fff
    transition: background-color .2s, width .1s
    text-align: left
    padding: .1em .4em
  &.failed .bar
    background-color: #b44
  &.done .bar
    background-color: #bb4
    text-align: center

a
  color: #42b983
</style>
