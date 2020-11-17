<template>
  <div id="meeting">
    <nav>
      <router-link to="/">Hem</router-link>
      <h1><router-link :to="`/m/${id}/${$slugify(meeting.title)}`">{{ meeting.title || 'Laddar möte' }}</router-link></h1>
    </nav>
    <div>
      <agenda id="meeting-agenda" />
      <router-view id="main-content" name="main" />
    </div>
  </div>
</template>

<script>
import { mapMutations, mapState } from 'vuex'
import Agenda from '@/components/meeting/Agenda'

export default {
  name: 'Meeting',
  components: {
    Agenda
  },
  data () {
    return {
      id: Number(this.$route.params.id)
    }
  },
  methods: {
    loadMeeting () {
      this.$api.get(`meetings/${this.id}/`)
        .then(({ data }) => {
          this.updateMeeting(data)
        })
        .catch(err => {
          alert('failed loading meeting', err)
        })
    },
    ...mapMutations('meetings', ['updateAgenda', 'updateMeeting'])
  },
  computed: {
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

<style lang="sass">
#meeting
  display: flex
  flex-direction: column
  min-height: 100vh
  nav
    padding: 8px
    background-color: #000
    color: fff
    display: flex
    justify-content: space-between
    a
      color: #ddf
    h1
      margin: 0
      flex-grow: 1
      color: #fff

  > div
    display: flex
    flex-grow: 1
    #meeting-agenda
      padding: 8px
      width: 280px
      text-align: left
      background-color: #eee
    #main-content
      flex-grow: 1
</style>
