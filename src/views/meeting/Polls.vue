<template>
  <div>
    <h1>Polls</h1>
    <ul v-if="polls.length">
      <li v-for="poll in polls" :key="poll.pk" :class="{ selected: poll.pk === pollSelected }">
        <a :href="'#poll-' + poll.pk" @click="selectPoll(poll)"><icon :name="pollStateIcon(poll)" sm /> {{ poll.title }}</a>
        <progress-bar v-if="poll.pk === pollSelected" absolute :value="selectedPollStatus.voted" :total="selectedPollStatus.total" />
      </li>
    </ul>
    <p v-else><em>No polls just yet</em></p>
    <div class="btn-group" v-if="hasRole('moderator')">
      <icon sm button name="add" @click="$alert('^Not implemented')">New poll</icon>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import MeetingBase from './MeetingBase.js'

export default {
  name: 'Polls',
  extends: MeetingBase,
  data () {
    return {
      pollSelected: null
    }
  },
  computed: {
    selectedPollStatus () {
      return this.getPollStatus(this.pollSelected)
    },
    ...mapGetters('polls', ['getPollStatus']),
    ...mapMutations('polls', ['updatePoll'])
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
          .catch(this.$apiError)
      }
    }
  },
  beforeUnmount () {
    if (this.pollSelected) {
      this.$channels.leave(`poll/${this.pollSelected}`, this)
    }
  }
}
</script>

<style lang="sass">
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
