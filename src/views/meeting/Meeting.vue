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
import { computed, watch } from 'vue'
import { emitter } from '../../utils'

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

    const presenceCheck = computed(_ => {
      return presence.getOpenPresenceCheck(meeting.meetingId.value)
    })

    const isPresent = computed(_ => {
      return presenceCheck.value && presence.getUserPresence(presenceCheck.value.pk)
    })

    watch(isPresent, value => {
      // Can be undefined, false, true
      switch (value) {
        case false:
          emitter.emit('bubble_open', {
            uri: 'presence_check',
            component: PresenceCheck,
            icon: 'pan_tool',
            componentData: {
              presenceCheck
            }
          })
          break
        case true:
        case undefined:
          emitter.emit('bubble_close', 'presence_check')
          break
      }
    })

    return {
      loader: useLoader('Meeting'),
      restApi: useRestApi(),
      ...meeting,
      ...usePolls(),
      channel
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
    polls () {
      return this.getPolls(this.meetingId)
    },
    ongoingPollCount () {
      if (this.hasRole('potential_voter')) {
        return this.polls.filter(p => p.state === 'ongoing').length
      }
      return 0
    },
    agenda () {
      return this.getAgenda(this.meetingId)
    }
  },
  created () {
    this.loader.call(this.fetchMeeting)
    this.loader.call(_ => this.fetchPolls(this.meetingId))
    this.channel.subscribe(this.meetingId)
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
    #main-content
      flex-grow: 1
      padding: 0 10px
</style>
