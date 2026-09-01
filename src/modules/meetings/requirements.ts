import { shallowRef, watch } from 'vue'

import { channelRequirement, paramPk } from '@/loader/channelRequirement'
import type { Requirement, RequirementFactory } from '@/loader/types'
import { ErrorStatus, isSubscribeError } from '@/socket/defineChannel'
import { slugify } from '@/utils'
import { openDialogEvent } from '@/utils/events'
import { t } from '@/utils/locales'
import { ThemeColor } from '@/utils/types'

import { moderatorChannel, participantChannel } from './contentTypes'
import { isModerator } from './rules'
import useMeetingStore from './useMeetingStore'

/**
 * Whether the last attempt to fetch a meeting failed outright - a network
 * error, or the server refusing us. Distinct from a meeting we simply have no
 * role in, which redirects to the join view instead. `MeetingView` turns this
 * into the permission dialog, so an anonymous visitor following a meeting link
 * is offered a login.
 */
export const meetingFetchFailed = shallowRef(false)

type RoleChannel = typeof participantChannel

/**
 * Everything the meeting itself needs: the meeting object, then the channel
 * carrying its content.
 *
 * The two are one requirement because they're one sequence - the fetch is what
 * tells us the user's roles, and the roles are what decide whether to subscribe
 * as moderator or as participant. That choice is then kept up to date for as
 * long as the requirement is held: see `swapTo`.
 */
export const meetingRequirement: RequirementFactory = (to) => {
  const pk = paramPk(to, 'id')
  if (!pk) return
  const { fetchMeeting, getMeeting } = useMeetingStore()
  let channel: Requirement | undefined
  /** The channel `channel` is on, to tell a real role change from a repeat. */
  let subscribedAs: RoleChannel | undefined
  let stopWatching: (() => void) | undefined
  /** Bumped so a swap that has been overtaken, or released, gives itself up. */
  let generation = 0

  const roleChannel = () =>
    isModerator(getMeeting(pk)) ? moderatorChannel : participantChannel

  /**
   * Move the meeting onto the channel the user's roles now call for.
   *
   * The new subscription is taken before the old one is given back. The other
   * way round leaves a moment with neither subscribed, and these two channels
   * leave after half a second - long enough for `contentCleanup` to find the
   * meeting's content unprotected and drop it. Holding both briefly is safe:
   * the content is registered under either channel type.
   */
  const swapTo = async (wanted: RoleChannel) => {
    const current = ++generation
    const taking = channelRequirement(wanted, pk)
    try {
      // Nobody is waiting on this one - the navigation that asked for the
      // meeting is long over, so it reports no progress.
      await taking.load(() => {})
    } catch (e) {
      taking.release?.()
      return console.warn(`Could not move meeting ${pk} to ${wanted.name}`, e)
    }
    // Overtaken by another swap, or released while we were subscribing
    if (current !== generation) return taking.release?.()
    const previous = channel
    channel = taking
    subscribedAs = wanted
    previous?.release?.()
  }

  return {
    key: `meeting/${pk}`,
    // The one requirement worth waiting for: the meeting decides whether we
    // belong on this route at all, and a redirect is the one answer that can't
    // be given once the view is mounted. There's nothing to show without it
    // either - everything under MeetingRouterView is meeting content.
    blocking: true,
    async load(report) {
      meetingFetchFailed.value = false
      try {
        if (!(await fetchMeeting(pk)))
          // Fetch was fine, the user just has no role here
          return {
            name: 'meeting:join',
            params: { id: pk, slug: slugify(getMeeting(pk)?.title) }
          }
      } catch (e) {
        // Left to MeetingView's usePermission, which knows how to ask an
        // anonymous visitor to log in
        console.warn('Could not fetch meeting', pk, e)
        meetingFetchFailed.value = true
        return
      }

      subscribedAs = roleChannel()
      channel = channelRequirement(subscribedAs, pk)
      try {
        await channel.load(report)
      } catch (e) {
        if (!isSubscribeError(e) || e.status !== ErrorStatus.NotFound) throw e
        // No such channel means no such meeting, or not ours - nothing to wait
        // for, unlike a timeout, which the channel retries on reconnect.
        openDialogEvent.emit({
          dismissible: false,
          title: t('meeting.subscriptionFailedMessage'),
          theme: ThemeColor.Error,
          no: false,
          yes: t('meeting.subscriptionFailedButton'),
          resolve() {}
        })
        return { name: 'home' }
      }

      // Roles can change while the user is in the meeting: someone made
      // moderator needs the channel that carries moderator content, and
      // someone stood down should stop receiving it. This requirement is held
      // for as long as they're in here and is never collected again, so the
      // swap has to come from within it. The watcher belongs to no effect
      // scope - `release` below is the only thing that stops it.
      stopWatching = watch(
        () => isModerator(getMeeting(pk)),
        (moderator) => {
          // Undefined is the meeting not being in the store for a moment, not
          // the user having stopped being a moderator
          if (moderator === undefined) return
          const wanted = moderator ? moderatorChannel : participantChannel
          if (wanted !== subscribedAs) swapTo(wanted)
        }
      )
    },
    release() {
      generation++
      stopWatching?.()
      stopWatching = undefined
      channel?.release?.()
      channel = undefined
      subscribedAs = undefined
    }
  }
}
