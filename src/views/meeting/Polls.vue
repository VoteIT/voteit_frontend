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
      <icon sm button name="add" @click="$router.push(meetingPath + '/polls/new')">New poll</icon>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'

import useRestApi from '@/composables/useRestApi.js'
import useChannels from '@/composables/useChannels.js'
import useMeeting from '@/composables/meeting/useMeeting.js'
import usePolls from '@/composables/meeting/usePolls.js'

const PollStateIcon = {
  private: 'visibility_off',
  upcoming: 'pause',
  ongoing: 'play_arrow',
  finished: 'done'
}

export default {
  name: 'Polls',
  setup () {
    const { meetingId, fetchMeeting, hasRole, meetingPath } = useMeeting()
    const { fetchPolls, getPolls } = usePolls()
    const { subscribe, leave } = useChannels()
    const { restApi, restError } = useRestApi()

    const polls = computed(_ => {
      return getPolls(meetingId.value)
    })

    const pollSelected = ref(null)
    function selectPoll (poll) {
      if (pollSelected.value) {
        this.$channels.leave(`poll/${pollSelected.value}`, this)
      }
      if (pollSelected.value === poll.pk) {
        pollSelected.value = null
      } else {
        pollSelected.value = poll.pk
        subscribe(`poll/${poll.pk}`, this)
        restApi.get(`polls/${poll.pk}/`)
          .then(({ data }) => {
            this.updatePoll({
              t: 'poll.status',
              p: data
            })
          })
          .catch(restError)
      }
    }
    const selectedPollStatus = computed(_ => {
      return this.getPollStatus(this.pollSelected)
    })

    function getPollStateIcon (state) {
      return PollStateIcon[state] || ''
    }

    return {
      hasRole,
      fetchMeeting,
      fetchPolls,
      meetingId,
      meetingPath,
      polls,
      pollSelected,
      selectedPollStatus,
      selectPoll,
      getPollStateIcon,
      subscribe,
      leave
    }
  },
  beforeUnmount () {
    if (this.pollSelected) {
      this.leave(`poll/${this.pollSelected}`, this)
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
