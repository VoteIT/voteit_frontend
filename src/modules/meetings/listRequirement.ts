import type { RequirementFactory } from '@/loader/types'

import useAuthStore from '../auth/useAuthStore'

import useMeetingStore from './useMeetingStore'

/**
 * The user's meetings, behind the home and join views. A plain fetch holding
 * nothing, so it runs again on every navigation that asks for it.
 *
 * Kept apart from the rest of the meeting requirements: the home route needs
 * it, and the organisations module is imported before meetings, so it must not
 * reach anything that pulls the meetings module in early.
 */
export const meetingListRequirement: RequirementFactory = () => ({
  key: 'meeting-list',
  async load() {
    // Asked here and not in the factory: factories run before the boot fetches
    // have settled who is signed in, and a requirement that appeared only once
    // they had would move the progress bar's total under it.
    if (!useAuthStore().isAuthenticated) return
    await useMeetingStore().fetchMeetings()
  }
})
