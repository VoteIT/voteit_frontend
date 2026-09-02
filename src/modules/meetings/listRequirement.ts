import type { RequirementFactory } from '@/loader/types'

import useMeetingStore from './useMeetingStore'

/**
 * The user's meetings, behind the home and join views. A plain fetch holding
 * nothing, so it runs again on every navigation that asks for it. Both those
 * routes are shown to anonymous visitors too, who simply don't get here - the
 * loader runs no requirements without a session.
 *
 * Kept apart from the rest of the meeting requirements: the home route needs
 * it, and the organisations module is imported before meetings, so it must not
 * reach anything that pulls the meetings module in early.
 */
export const meetingListRequirement: RequirementFactory = () => ({
  key: 'meeting-list',
  async load() {
    await useMeetingStore().fetchMeetings()
  }
})
