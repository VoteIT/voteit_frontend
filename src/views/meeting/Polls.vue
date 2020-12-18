<template>
  <main id="polls">
    <h1>Polls</h1>
    <ul v-if="polls.length">
      <li v-for="poll in polls" :key="poll.pk" :class="{ selected: poll.pk === pollSelected }">
        <a :href="'#poll-' + poll.pk" @click="selectPoll(poll)">
          {{ poll.title }}
          <icon :name="getPollStateIcon(poll)" sm :title="poll.state" />
        </a>
        <progress-bar v-if="poll.pk === pollSelected && selectedPollStatus" absolute :value="selectedPollStatus.voted" :total="selectedPollStatus.total" />
      </li>
    </ul>
    <p v-else><em>No polls just yet</em></p>
    <div class="btn-group" v-if="hasRole('moderator')">
      <btn icon="star" @click="$router.push(meetingPath + '/polls/new')">New poll</btn>
    </div>
  </main>
</template>

<script>
import { computed, ref } from 'vue'

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
    const { fetchPolls, getPolls, getPollStatus, fetchPollStatus } = usePolls()
    const { subscribe, leave } = useChannels()

    const polls = computed(_ => {
      return getPolls(meetingId.value)
    })

    const pollSelected = ref(null)
    function selectPoll (poll) {
      if (pollSelected.value) {
        leave(`poll/${pollSelected.value}`)
      }
      if (pollSelected.value === poll.pk) {
        pollSelected.value = null
      } else {
        pollSelected.value = poll.pk
        subscribe(`poll/${poll.pk}`)
        fetchPollStatus(poll.pk)
      }
    }
    const selectedPollStatus = computed(_ => {
      return getPollStatus(pollSelected.value)
    })

    function getPollStateIcon (p) {
      return PollStateIcon[p.state] || ''
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

<style lang="sass" scoped>
main
  ul
    padding: 0
    list-style-type: none
    li
      margin-bottom: .5rem
      padding: .5rem
      background-color: #eee
      a
        color: #000
        display: block
        text-decoration: none
      &.selected a
        margin-bottom: .5rem
  .material-icons
    float: right
</style>
