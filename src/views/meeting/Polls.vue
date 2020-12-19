<template>
  <main id="polls">
    <h1>Polls</h1>
    <ul v-if="polls.length">
      <li v-for="poll in polls" :key="poll.pk" :class="{ selected: poll.pk === pollSelected }">
        <div class="head">
          <a :href="'#poll-' + poll.pk" @click="selectPoll(poll)">
            {{ poll.title }}
          </a>
          <workflow-state :state="poll.state" :allStates="wfStates" :admin="hasRole('moderator')" content-type="poll" :pk="poll.pk" />
        </div>
        <div class="body" v-if="poll.pk === pollSelected && selectedPollStatus && selectedPollStatus.total">
          <progress-bar absolute :value="selectedPollStatus.voted" :total="selectedPollStatus.total" />
        </div>
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

import WorkflowState from '../../components/widgets/WorkflowState.vue'

import useChannels from '@/composables/useChannels.js'
import useMeeting from '@/composables/meeting/useMeeting.js'
import usePolls from '@/composables/meeting/usePolls.js'

import pollStates from '../../schemas/pollStates.json'

export default {
  name: 'Polls',
  components: {
    WorkflowState
  },
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

    const wfStates = computed(_ => pollStates)

    return {
      wfStates,
      hasRole,
      fetchMeeting,
      fetchPolls,
      meetingId,
      meetingPath,
      polls,
      pollSelected,
      selectedPollStatus,
      selectPoll,
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
      .head
        display: flex
      a
        flex: 1 0 auto
        color: #000
        display: block
        text-decoration: none
        font-weight: bold
      &.selected a
        margin-bottom: .5rem
      .body
        padding: .5rem
  .material-icons
    float: right
</style>
