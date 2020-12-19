<template>
  <main id="polls">
    <nav class="tabs">
      <router-link v-for="s in tabStates" :key="s.state" :to="getStatePath(s)"><icon sm :name="s.icon"/> {{ s.name }} <span v-if="s.polls.length">({{ s.polls.length }})</span></router-link>
    </nav>
    <h1>{{ currentState.name }} polls</h1>
    <div class="btn-group" v-if="hasRole('moderator')">
      <btn icon="star" @click="$router.push(meetingPath + '/polls/new')">New poll</btn>
    </div>
    <ul v-if="currentPolls.length">
      <li v-for="poll in currentPolls" :key="poll.pk" :class="{ selected: poll.pk === pollSelected }">
        <div class="head">
          <a :href="'#poll-' + poll.pk" @click="selectPoll(poll)">
            {{ poll.title }}
          </a>
          <workflow-state :state="poll.state" :allStates="wfStates" :admin="hasRole('moderator')" content-type="poll" :pk="poll.pk" />
        </div>
        <div class="body" v-if="poll.pk === pollSelected && selectedPollStatus && selectedPollStatus.total">
          <progress-bar v-if="poll.state === 'ongoing'" absolute :value="selectedPollStatus.voted" :total="selectedPollStatus.total" />
          <p v-else>
            Other info
          </p>
        </div>
      </li>
    </ul>
    <p v-else><em>No polls in this state just yet</em></p>
  </main>
</template>

<script>
import { computed, onBeforeUnmount, ref } from 'vue'

import WorkflowState from '../../components/widgets/WorkflowState.vue'
import { useRoute } from 'vue-router'

import useChannels from '@/composables/useChannels.js'
import useMeeting from '@/composables/meeting/useMeeting.js'
import usePolls from '@/composables/meeting/usePolls.js'

import pollStates from '../../schemas/pollStates.js'

const tabOrder = [
  'ongoing',
  'upcoming',
  'finished',
  'private'
]

export default {
  name: 'Polls',
  components: {
    WorkflowState
  },
  setup () {
    const { meetingId, hasRole, meetingPath } = useMeeting()
    const { getPolls, getPollStatus, fetchPollStatus } = usePolls()
    const channels = useChannels()
    const route = useRoute()

    const polls = computed(_ => {
      return getPolls(meetingId.value)
    })

    const pollSelected = ref(null)
    function selectPoll (poll) {
      if (pollSelected.value) {
        channels.leave(`poll/${pollSelected.value}`)
      }
      if (pollSelected.value === poll.pk) {
        pollSelected.value = null
      } else {
        pollSelected.value = poll.pk
        channels.subscribe(`poll/${poll.pk}`)
        fetchPollStatus(poll.pk)
      }
    }
    const selectedPollStatus = computed(_ => {
      return getPollStatus(pollSelected.value)
    })

    const currentState = computed(_ => pollStates.find(
      s => s.state === (route.params.state || 'ongoing')
    ) || {})
    const wfStates = computed(_ => pollStates)
    function getStatePolls (state) {
      return polls.value.filter(p => p.state === state)
    }
    const tabStates = computed(_ => {
      return tabOrder.map(state => {
        return Object.assign({},
          pollStates.find(s => s.state === state),
          { polls: getStatePolls(state) }
        )
      })
    })
    const currentPolls = computed(
      _ => getStatePolls(currentState.value.state)
    )

    onBeforeUnmount(_ => {
      if (pollSelected.value) {
        channels.leave(`poll/${pollSelected.value}`)
      }
    })

    return {
      wfStates,
      tabStates,
      currentState,
      currentPolls,
      hasRole,
      meetingId,
      meetingPath,
      polls,
      pollSelected,
      selectedPollStatus,
      selectPoll,
      getStatePath (s) {
        if (s.state === 'ongoing') {
          return `${meetingPath.value}/polls`
        }
        return `${meetingPath.value}/polls/${s.state}`
      }
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

nav.tabs
  display: flex
  margin-top: 20px
  border-bottom: 1px solid #bbb
  padding-bottom: 0
  a
    text-decoration: none
    margin: 0 5px -1px
    padding: 8px 12px
    border: 1px solid #000
    border-bottom: 0
    border-radius: 4px 4px 0 0
    background-color: #333
    font-weight: 700
    color: #ddf
    > span
      vertical-align: super
      font-size: 80%
    .material-icons
      color: #779
      vertical-align: text-bottom
    &.router-link-exact-active
      background-color: #fff
      color: #000
      border-color: #bbb
</style>
