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
              <a :href="'#poll-' + poll.pk" @click="selectPoll(poll)"><icon :name="pollStateIcon(poll)" sm /> {{ poll.title }}</a>
              <progress-bar v-if="poll.pk === pollSelected" absolute :value="selectedPollStatus.voted" :total="selectedPollStatus.total" />
            </li>
          </ul>
        </div>
      </div>
    </nav>
    <nav class="tabs" v-if="navigationLinks.length">
      <router-link v-for="link in navigationLinks" :key="link.path" :to="`${meetingPath}/${link.path}`">
        <icon sm :name="link.icon" />
        {{ link.title }}
        <span v-if="link.count">({{ count }})</span>
      </router-link>
    </nav>
    <div>
      <agenda />
      <router-view id="main-content" name="main" />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import Agenda from '@/components/meeting/Agenda'

const NAV_LINKS = [
  {
    role: 'potential_voter', // FIXME Permissions
    title: 'Polls',
    icon: 'star',
    path: 'polls',
    countAttr: 'polls'
  },
  {
    role: 'moderator',
    title: 'Participants',
    icon: 'people',
    path: 'participants'
  }
]

export default {
  name: 'Meeting',
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
    pollStateIcon (poll) {
      return {
        private: 'visibility_off',
        upcoming: 'pause',
        ongoing: 'play_arrow',
        finished: 'done'
      }[poll.state] || ''
    },
    initialize () {
      return Promise.all([
        this.$api.get(`meetings/${this.id}/`)
          .then(({ data }) => {
            this.updateMeeting(data)
          }),
        this.$api.get('polls/', { params: { agenda_item__meeting: this.id } })
          .then(({ data }) => {
            this.setPolls({
              meeting: this.id,
              polls: data
            })
          })
      ])
    },
    selectPoll (poll) {
      if (this.pollSelected) {
        this.$channels.leave(`poll/${this.pollSelected}`, this)
      }
      if (this.pollSelected === poll.pk) {
        this.pollSelected = null
      } else {
        this.pollSelected = poll.pk
        this.$channels.subscribe(`poll/${poll.pk}`, this)
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
    hasRole (roleName) {
      return this.userRoles.includes(roleName)
    },
    ...mapMutations('meetings', ['updateAgenda', 'updateMeeting']),
    ...mapMutations('polls', ['setPolls', 'updatePoll'])
  },
  computed: {
    meetingPath () {
      return `/m/${this.id}/${this.$slugify(this.meeting.title)}`
    },
    navigationLinks () {
      return NAV_LINKS
        .filter(l => this.hasRole(l.role))
        .map(l => {
          // TODO Check this with reactivity
          if (l.countAttr) {
            return Object.assign(l, {
              count: this[l.countAttr].length
            })
          }
          return l
        })
    },
    userRoles () {
      return this.meeting.current_user_roles || []
    },
    meeting () {
      return this.getMeeting(this.id)
    },
    agenda () {
      return this.getAgenda(this.id)
    },
    polls () {
      return this.getMeetingPolls(this.id)
    },
    selectedPollStatus () {
      return this.getPollStatus(this.pollSelected)
    },
    ...mapGetters('polls', ['getMeetingPolls', 'getPollStatus']),
    ...mapGetters('meetings', ['getMeeting', 'getAgenda'])
  },
  beforeUnmount () {
    if (this.pollSelected) {
      this.$channels.leave(`poll/${this.pollSelected}`, this)
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
    &.tabs
      padding-bottom: 0
      justify-content: flex-end
      a
        text-decoration: none
        margin-right: 10px
        padding: 8px 12px
        border-radius: 4px 4px 0 0
        background-color: #333
        font-weight: 700
        &.router-link-exact-active
          background-color: #fff
          background-color: #fff
          color: #000

  > div
    display: flex
    flex-grow: 1
    #agenda
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
  .material-icons
    color: #aaa
</style>
