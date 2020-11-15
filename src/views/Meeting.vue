<template>
  <div id="meeting">
    <router-link to="/">Hem</router-link>
    <h1>{{ meeting.title || 'Ladda möte' }}</h1>
    <agenda v-if="agenda.length" />
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
      id: this.$route.params.id
    }
  },
  methods: {
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

<style scoped lang="sass">
h3
  margin: 40px 0 0
ul
  list-style-type: none
  padding: 0

  li
    display: inline-block
    margin: 0 10px

a
  color: #42b983
</style>
