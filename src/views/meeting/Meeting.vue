<template>
  <div id="meeting" v-if="meeting">
    <header>
      <nav>
        <RouterLink to="/">{{ t('home.home') }}</RouterLink>
        <h1><RouterLink :to="meetingPath">{{ meeting.title || t('loader.loading') }}</RouterLink></h1>
        <span class="user" title="Your username">
          <Icon :name="hasRole('moderator') ? 'gavel' : 'face' "/>
          {{ user.username }}
        </span>
      </nav>
      <nav class="tabs">
        <RouterLink v-for="link in navigationLinks" :key="link.path" :to="`${meetingPath}/${link.path}`">
          <Icon sm :name="link.icon" />
          {{ link.title }}
          <span v-if="link.count">({{ link.count() }})</span>
        </RouterLink>
      </nav>
    </header>
    <div>
      <Agenda />
      <RouterView id="main-content" />
    </div>
  </div>
  <Bubbles widgets="bubbleWidgets" />
</template>

<script lang="ts">
import { computed, defineComponent, inject, onBeforeMount, onMounted, provide, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'

import { slugify } from '@/utils'

import Agenda from '@/components/meeting/Agenda.vue'
import Bubbles from '@/components/meeting/Bubbles.vue'
import PresenceCheck from '@/components/meeting/bubbles/PresenceCheck.vue'

import useAuthentication from '@/composables/useAuthentication'
import useBubbles from '@/composables/meeting/useBubbles'
import Channel from '@/contentTypes/Channel'
import useLoader from '@/composables/useLoader'
import useMeeting from '@/composables/meeting/useMeeting'
import usePolls from '@/composables/meeting/usePolls'
import usePresence from '@/composables/meeting/usePresence'
import useSpeakerLists from '@/composables/meeting/useSpeakerLists'

import meetingType from '@/contentTypes/meeting'
import { BubbleComponent } from '@/components/meeting/bubbles/types'
import { MeetingRole } from '@/contentTypes/types'

interface NavLink {
  title: string
  icon: string
  path: string
  role?: MeetingRole
  count?: () => number
}

export default defineComponent({
  name: 'Meeting',
  setup () {
    const t = inject('t') as CallableFunction
    const navLinks: NavLink[] = [
      {
        role: MeetingRole.Moderator,
        title: t('settings'),
        icon: 'settings',
        path: 'settings'
      },
      {
        // role: ['potential_voter', 'moderator'], // FIXME Permissions
        title: t('poll.polls'),
        icon: 'star',
        path: 'polls',
        count: () => getPolls(meetingId.value, 'ongoing').length
      },
      {
        role: MeetingRole.Moderator,
        title: t('meeting.participants'),
        icon: 'people',
        path: 'participants'
      }
    ]
    const navigationLinks = computed(() => {
      return navLinks
        .filter(l => !l.role || hasRole(l.role))
    })

    const loader = useLoader('Meeting')
    const router = useRouter()
    const { meeting, meetingId, meetingPath, setMeeting, meetingApi, hasRole } = useMeeting()
    const channel = meetingType.getChannel()
    const { user } = useAuthentication()

    const presence = usePresence()
    const presenceBubble = useBubbles(PresenceCheck as BubbleComponent)

    const speakers = useSpeakerLists()

    const presenceCheck = computed(() => presence.getOpenPresenceCheck(meetingId.value))
    const isPresent = computed(() => presenceCheck.value && !!presence.getUserPresence(presenceCheck.value.pk))

    function checkIsPresent (value?: boolean) {
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

    onMounted(() => checkIsPresent(isPresent.value))
    watch(isPresent, checkIsPresent)

    const { getPolls } = usePolls()
    const polls = computed(() => getPolls(meetingId.value))
    const ongoingPollCount = computed(() => getPolls(meetingId.value, 'ongoing').length)

    const channels = new Channel() // For dynamic usage
    const isModerator = computed(() => hasRole(MeetingRole.Moderator))
    let currentRoleChannel: string | null = null
    async function leaveRoleChannel () {
      if (currentRoleChannel) {
        return channels.leave(currentRoleChannel, { leaveDelay: 0 })
          .then(() => {
            currentRoleChannel = null
          })
      }
      return Promise.resolve()
    }
    function enterRoleChannel () {
      if (meetingId.value) {
        const channelName = `${isModerator.value ? 'moderators' : 'participants'}/${meetingId.value}`
        if (channelName !== currentRoleChannel) {
          leaveRoleChannel()
            .then(() => {
              currentRoleChannel = channelName
              channels.subscribe(channelName)
            })
        }
      }
    }
    watch(isModerator, enterRoleChannel)

    onBeforeMount(() => {
      loader.call(() => {
        meetingApi.retrieve(meetingId.value)
          .then(({ data }) => {
            if (!data.current_user_roles) {
              router.push(`/join/${meetingId.value}/${slugify(meeting.value ? meeting.value.title : '-')}`)
            }
            setMeeting(data)
            enterRoleChannel()
          })
          .catch(() => {
            router.push('/')
          })
      })
      loader.subscribe(channel, meetingId.value)
    })
    onBeforeRouteLeave(() => {
      channel.leave(meetingId.value)
      leaveRoleChannel()
    })

    provide('hasRole', hasRole)

    return {
      navigationLinks,
      meeting,
      meetingId,
      meetingPath,
      polls,
      ongoingPollCount,
      channel,
      speakers,
      t,
      user,
      hasRole
    }
  },
  components: {
    Agenda,
    Bubbles
  }
})
</script>

<style lang="sass">
header
  nav
    padding: 8px
    background-color: var(--nav-bg)
    color: fff
    display: flex
    justify-content: space-between
    .user
      color: var(--discrete-icon)
      padding: 0 3px
      font-weight: bold
      transform: rotate(3deg)
      .material-icons
        color: var(--discrete-icon)
        vertical-align: bottom
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
        background-color: var(--nav-tab-bg)
        font-weight: 700
        > span
          vertical-align: super
          font-size: 80%
        .material-icons
          color: var(--discrete-icon)
          vertical-align: text-bottom
        &.router-link-active
          background-color: var(--nav-tab-active-bg)
          color: var(--nav-tab-active-text)

#meeting
  display: flex
  flex-direction: column
  min-height: 100vh
  > div
    display: flex
    flex-grow: 1
    #agenda
      width: 280px
      padding-top: .5em
      text-align: left
      background-color: var(--agenda-bg)
      flex-shrink: 0
    #main-content
      flex-grow: 1
      padding: 0 10px 80px
</style>
