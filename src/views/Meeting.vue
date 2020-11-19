<template>
  <div id="meeting">
    <nav>
      <router-link to="/">Hem</router-link>
      <h1><router-link :to="`/m/${id}/${$slugify(meeting.title)}`">{{ meeting.title || 'Laddar möte' }}</router-link></h1>
      <div id="poll-menu" v-show="polls.length">
        <button @click="pollMenuOpen = !pollMenuOpen"><icon name="star" /> {{ polls.length }}</button>
        <div id="poll-window" v-if="pollMenuOpen">
          <h2>Polls</h2>
          <ul>
            <li v-for="poll in polls" :key="poll.pk" :class="{ selected: poll.pk === pollSelected }">
              <a :href="'#poll-' + poll.pk" @click="selectPoll(poll)">{{ poll.title }}</a>
              <progress-bar v-if="poll.pk === pollSelected" absolute :value="selectedPollStatus.voted" :total="selectedPollStatus.total" />
            </li>
          </ul>
        </div>
      </div>
    </nav>
    <div>
      <agenda id="meeting-agenda" />
      <router-view id="main-content" name="main" />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations, mapState } from 'vuex'
import Agenda from '@/components/meeting/Agenda'
import BaseView from './BaseView'

export default {
  name: 'Meeting',
  extends: BaseView,
  components: {
    Agenda
  },
  data () {
    return {
      id: Number(this.$route.params.id),
      pollMenuOpen: false,
      pollSelected: null
    }
  },
  methods: {
    initialize () {
      this.$api.get(`meetings/${this.id}/`)
        .then(({ data }) => {
          this.updateMeeting(data)
        })
        .catch(err => {
          alert('failed loading meeting', err)
        })
      this.$api.get('polls/', { params: { agenda_item__meeting: this.id } })
        .then(({ data }) => {
          this.setPolls({
            meeting: this.id,
            polls: data
          })
        })
        .catch(err => {
          alert('failed loading polls', err)
        })
    },
    selectPoll (poll) {
      if (this.pollSelected) {
        this.$objects.leave(`poll/${this.pollSelected}`, this)
      }
      if (this.pollSelected === poll.pk) {
        this.pollSelected = null
      } else {
        this.pollSelected = poll.pk
        this.$objects.subscribe(`poll/${poll.pk}`, this)
        this.$api.get(`polls/${poll.pk}/`)
          .then(({ data }) => {
            this.updatePoll({
              t: 'poll.status',
              p: data
            })
          })
          .catch(err => {
            alert('failed loading poll', err)
          })
      }
    },
    ...mapMutations('meetings', ['updateAgenda', 'updateMeeting']),
    ...mapMutations('polls', ['setPolls', 'updatePoll'])
  },
  computed: {
    meeting () {
      return this.meetings[this.id] || {}
    },
    agenda () {
      return this.agendas[this.id] || []
    },
    polls () {
      return this.meetingPolls(this.id)
    },
    selectedPollStatus () {
      return this.pollStatus[this.pollSelected] || {}
    },
    ...mapState('meetings', ['meetings', 'agendas']),
    ...mapState('polls', ['pollStatus']),
    ...mapGetters('polls', ['meetingPolls'])
  },
  beforeUnmount () {
    if (this.pollSelected) {
      this.$objects.leave(`poll/${this.pollSelected}`, this)
    }
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
      padding: 0 10px

#poll-menu
  position: relative

#poll-window
  position: absolute
  right: 0
  width: 400px
  padding: 10px
  background-color: #fff
  border: 1px solid #ddd
  box-shadow: 0 2px 3px rgba(#000, .4)
  ul
    padding: 0
    list-style-type: none
    li.selected
      background-color: #fff
    a
      color: #000
      display: block
      padding: 4px
</style>
