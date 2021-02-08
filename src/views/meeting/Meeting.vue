<template>
  <div id="meeting">
    <header>
      <nav>
        <router-link to="/">Hem</router-link>
        <h1><router-link :to="meetingPath">{{ meeting.title || 'Laddar möte' }}</router-link></h1>
      </nav>
      <nav class="tabs" v-if="navigationLinks.length">
        <router-link v-for="link in navigationLinks" :key="link.path" :to="`${meetingPath}/${link.path}`">
          <icon sm :name="link.icon" />
          {{ link.title }}
          <span v-if="link.count">({{ link.count }})</span>
        </router-link>
      </nav>
    </header>
    <div>
      <agenda />
      <router-view id="main-content" />
    </div>
  </div>
  <bubbles widgets="bubbleWidgets" />
</template>

<script>
import Agenda from '@/components/meeting/Agenda'
import Bubbles from '@/components/meeting/Bubbles'
import PresenceCheck from '@/components/meeting/bubbles/PresenceCheck'

import useLoader from '@/composables/useLoader.js'
import useRestApi from '@/composables/useRestApi.js'
import useChannels from '@/composables/useChannels.js'
import useMeeting from '@/composables/meeting/useMeeting.js'
import usePolls from '@/composables/meeting/usePolls.js'
import usePresence from '@/composables/meeting/usePresence.js'
import useBubbles from '@/composables/meeting/useBubbles.js'
import useSpeakerLists from '@/composables/meeting/useSpeakerLists.js'
import { computed, onMounted, watch } from 'vue'

const NAV_LINKS = [
  {
    // role: ['potential_voter', 'moderator'], // FIXME Permissions
    title: 'Polls',
    icon: 'star',
    path: 'polls',
    countAttr: 'ongoingPollCount'
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
  setup () {
    const meeting = useMeeting()
    const channel = useChannels('meeting')

    const presence = usePresence()
    const presenceBubble = useBubbles(PresenceCheck)

    const speakers = useSpeakerLists()

    const presenceCheck = computed(_ => presence.getOpenPresenceCheck(meeting.meetingId.value))
    const isPresent = computed(_ => presenceCheck.value && !!presence.getUserPresence(presenceCheck.value.pk))

    function checkIsPresent (value) {
      // Can be false, true or undefined.
      switch (value) {
        case false:
          // Presence check, user not present
          presenceBubble.activate({ presenceCheck })
          break
        case true:
          // Presence check, user present
          presenceBubble.activate({ presenceCheck }, { open: false }) // Make sure bubble is active when presence check active. (app state)
          presenceBubble.close() // If user interaction, close bubble window
          break
        case undefined:
          // No presence check
          presenceBubble.remove()
          break
      }
    }

    onMounted(_ => checkIsPresent(isPresent.value))
    watch(isPresent, checkIsPresent)

    const { getPolls, fetchPolls } = usePolls()
    const polls = computed(_ => getPolls(meeting.meetingId.value))
    const ongoingPollCount = computed(_ => getPolls(meeting.meetingId.value, 'ongoing').length)

    return {
      loader: useLoader('Meeting'),
      restApi: useRestApi(),
      ...meeting,
      polls,
      ongoingPollCount,
      fetchPolls,
      channel,
      speakers
    }
  },
  components: {
    Agenda,
    Bubbles
  },
  computed: {
    navigationLinks () {
      return NAV_LINKS
        .filter(l => this.hasRole(l.role))
        .map(l => {
          if (l.countAttr) {
            l.count = this[l.countAttr]
          }
          return l
        })
    },
    agenda () {
      return this.getAgenda(this.meetingId)
    }
  },
  created () {
    this.loader.call(this.fetchMeeting)
    // this.loader.call(_ => this.fetchPolls(this.meetingId))
    this.loader.subscribe(this.channel, this.meetingId)
    // this.channel.subscribe(this.meetingId)
  },
  beforeRouteLeave (to, from, next) {
    this.channel.leave(this.meetingId)
    next()
  }
}
</script>

<style lang="sass">
header
  nav
    padding: 8px
    background-color: #111118
    color: fff
    display: flex
    justify-content: space-between
    a
      color: #fff
      margin-right: 1rem
    h1
      margin: 0
      flex-grow: 1
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
        > span
          vertical-align: super
          font-size: 80%
        .material-icons
          color: #779
          vertical-align: text-bottom
        &.router-link-active
          background-color: #fff
          color: #000

#meeting
  display: flex
  flex-direction: column
  min-height: 100vh
  > div
    display: flex
    flex-grow: 1
    #agenda
      padding: 8px
      width: 280px
      text-align: left
      background-color: #eee
      flex-shrink: 0
    #main-content
      flex-grow: 1
      padding: 0 10px 80px
</style>
