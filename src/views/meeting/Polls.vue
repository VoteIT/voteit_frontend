<template>
  <main id="polls">
    <nav class="tabs">
      <router-link v-for="s in tabStates" :key="s.state" :to="getStatePath(s)"><icon sm :name="s.icon"/> {{ s.name }} <span v-if="s.polls.length">({{ s.polls.length }})</span></router-link>
    </nav>
    <h1>{{ currentState.name }} polls</h1>
    <div class="btn-group" v-if="hasRole('moderator')">
      <btn icon="star" @click="$router.push(meetingPath + '/polls/new')">{{ t('poll.new') }}</btn>
    </div>
    <poll :poll="p" v-for="p in polls" :key="p.pk" />
    <p v-if="!polls.length"><em>No polls in this state just yet</em></p>
  </main>
</template>

<script>
import { computed } from 'vue'

import Poll from '../../components/widgets/Poll.vue'
import { useRoute } from 'vue-router'

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
  inject: ['t'],
  components: {
    Poll
  },
  setup () {
    const { meetingId, hasRole, meetingPath } = useMeeting()
    const { getPolls } = usePolls()
    const route = useRoute()

    const currentState = computed(_ => pollStates.find(
      s => s.state === (route.params.state || 'ongoing')
    ) || {})

    const polls = computed(_ => {
      return getPolls(meetingId.value, currentState.value.state)
    })

    const tabStates = computed(_ => {
      return tabOrder.map(state => {
        return Object.assign({},
          pollStates.find(s => s.state === state),
          { polls: getPolls(meetingId.value, state) }
        )
      })
    })

    return {
      tabStates,
      currentState,
      hasRole,
      meetingId,
      meetingPath,
      polls,
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
