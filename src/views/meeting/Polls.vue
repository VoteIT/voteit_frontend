<template>
  <main id="polls">
    <nav class="tabs">
      <RouterLink v-for="s in tabStates" :key="s.state" :to="getStatePath(s)"><Icon sm :name="s.icon"/> {{ s.name }} <span v-if="s.polls.length">({{ s.polls.length }})</span></RouterLink>
    </nav>
    <header>
      <h1>{{ currentState.name }} polls</h1>
      <Btn v-if="canAdd(meeting)" icon="mdi-star" @click="$router.push(meetingPath + '/polls/new')">{{ t('poll.new') }}</Btn>
    </header>
    <Poll :poll="p" v-for="p in polls" :key="p.pk" />
    <p v-if="!polls.length"><em>No polls in this state just yet</em></p>
  </main>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useRoute } from 'vue-router'

import Poll from '../../components/widgets/Poll.vue'

import useMeeting from '@/composables/meeting/useMeeting'
import usePolls from '@/composables/meeting/usePolls'

import pollType from '@/contentTypes/poll'
import { WorkflowState } from '@/contentTypes/types'

const TAB_ORDER = [
  'ongoing',
  'upcoming',
  'finished',
  'private'
]

export default defineComponent({
  name: 'Polls',
  inject: ['t'],
  components: {
    Poll
  },
  setup () {
    const { meeting, meetingPath, meetingId } = useMeeting()
    const { getPolls } = usePolls()
    const route = useRoute()
    const { getState } = pollType.useWorkflows()

    const currentState = computed(() => getState(
      route.params.state as string || 'ongoing'
    ))

    const polls = computed(() => {
      return getPolls(meetingId.value, currentState.value?.state)
    })

    const tabStates = computed(() => {
      return TAB_ORDER.map(state => {
        return {
          ...getState(state),
          polls: getPolls(meetingId.value, state)
        }
      })
    })

    return {
      tabStates,
      currentState,
      meeting,
      meetingPath,
      polls,
      ...pollType.rules,
      getStatePath (s: WorkflowState) {
        if (s.state === 'ongoing') {
          return `${meetingPath.value}/polls`
        }
        return `${meetingPath.value}/polls/${s.state}`
      }
    }
  }
})
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

header
  margin-bottom: 1em
</style>
