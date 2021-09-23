<template>
  <v-row>
    <v-col offset-lg="2" lg="8">
      <header>
        <Menu float :items="menuItems" />
        <h1>{{ t('poll.all') }}</h1>
      </header>
      <v-divider />
      <Dropdown v-for="s in tabStates" :key="s.state" :title="`${t(`workflowState.${s.state}`)} (${s.polls.length})`" :open="s.state==='ongoing'">
        <Poll :poll="p" v-for="p in s.polls" :key="p.pk" />
      </Dropdown>
      <p v-if="tabStates.length === 0">
        <em>{{ t('poll.noPublishedPolls') }}</em>
      </p>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

import Poll from '@/modules/polls/Poll.vue'

import useMeeting from '@/modules/meetings/useMeeting'
import usePolls from '@/modules/polls/usePolls'

import pollType from '@/contentTypes/poll'
import { WorkflowState } from '@/contentTypes/types'
import { MenuItem } from '@/utils/types'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'Polls',
  components: {
    Poll
  },
  setup () {
    const { t } = useI18n()
    const { meeting, meetingPath, meetingId } = useMeeting()
    const { getPolls } = usePolls()
    const { getPriorityStates } = pollType.useWorkflows()

    const tabStates = computed(() => {
      return getPriorityStates()
        .map(s => {
          return {
            ...s,
            polls: getPolls(meetingId.value, s.state)
          }
        })
        .filter(s => s.polls.length)
    })

    const menuItems = computed<MenuItem[]>(() => {
      if (!meeting.value || !pollType.rules.canAdd(meeting.value)) return []
      return [{
        icon: 'mdi-star',
        text: t('poll.new'),
        to: meetingPath.value + '/polls/new'
      }]
    })

    return {
      t,
      tabStates,
      menuItems,
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
