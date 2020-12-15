<template>
  <div id="meeting">
    <nav>
      <router-link to="/">Hem</router-link>
      <h1><router-link :to="meetingPath">{{ meeting.title || 'Laddar möte' }}</router-link></h1>
    </nav>
    <nav class="tabs" v-if="navigationLinks.length">
      <router-link v-for="link in navigationLinks" :key="link.path" :to="`${meetingPath}/${link.path}`">
        <icon sm :name="link.icon" />
        {{ link.title }}
        <span v-if="link.count">({{ count }})</span>
      </router-link>
    </nav>
    <div>
      <agenda />
      <router-view id="main-content" />
    </div>
  </div>
</template>

<script>
import Agenda from '@/components/meeting/Agenda'

import useLoader from '@/composables/useLoader.js'
import useRestApi from '@/composables/useRestApi.js'
import useChannels from '@/composables/useChannels.js'
import useMeeting from '@/composables/meeting/useMeeting.js'
import usePolls from '@/composables/meeting/usePolls.js'

const NAV_LINKS = [
  {
    // role: ['potential_voter', 'moderator'], // FIXME Permissions
    title: 'Polls',
    icon: 'star',
    path: 'polls',
    countAttr: 'polls'
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
    const { restApi } = useRestApi()
    const { subscribe, leave } = useChannels()
    return {
      ...useLoader(),
      ...useMeeting(),
      ...usePolls(),
      restApi,
      subscribe,
      leave
    }
  },
  components: {
    Agenda
  },
  methods: {
    initialize () {
      return Promise.all([
        this.fetchMeeting(),
        this.fetchPolls(this.meetingId)
      ])
    }
  },
  computed: {
    navigationLinks () {
      return NAV_LINKS
        .filter(l => this.hasRole(l.role))
        .map(l => {
          // TODO Check this with reactivity
          if (l.countAttr) {
            return Object.assign(l, {
              count: this[l.countAttr].length
            })
          }
          return l
        })
    },
    polls () {
      return this.getPolls(this.meetingId)
    },
    agenda () {
      return this.getAgenda(this.meetingId)
    }
  },
  created () {
    this.subscribe(`meeting/${this.meetingId}`)
    this.fetch(this.initialize)
  },
  beforeRouteLeave (to, from, next) {
    this.leave(`meeting/${this.meetingId}`)
    next()
  }
}
</script>

<style lang="sass">
#meeting
  display: flex
  flex-direction: column
  min-height: 100vh
  nav
    padding: 8px
    background-color: #000
    color: fff
    display: flex
    justify-content: space-between
    a
      color: #ddf
    h1
      margin: 0
      flex-grow: 1
      color: #fff
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
        &.router-link-active
          background-color: #fff
          background-color: #fff
          color: #000

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
