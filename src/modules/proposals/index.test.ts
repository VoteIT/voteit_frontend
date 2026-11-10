import { beforeEach, describe, expect, test, vi } from 'vitest'
import { ComposerTranslation } from 'vue-i18n'

// First, as in main.ts: ContentType, useContextRoles and the organisation
// content types form a cycle. See the "Import order important!" note in useAuthStore.
import '@/modules/auth/useAuthStore'

import { Predicate } from '@/utils/types'
import { meetingType } from '../meetings/contentTypes'
import { Meeting, MeetingState } from '../meetings/types'
import { Proposal, ProposalState } from './types'

let proposals: Pick<Proposal, 'm' | 'state'>[] = []

vi.mock('./useProposalStore', () => ({
  default: () => ({
    anyProposal: (predicate: Predicate<Proposal>) =>
      proposals.some((p) => predicate(p as Proposal))
  })
}))

// Registers the guards
import './index'

const t = ((key: string) => key) as ComposerTranslation
const meeting = { pk: 1, state: MeetingState.Ongoing } as Meeting

describe('meeting close guard', () => {
  beforeEach(() => {
    proposals = []
  })

  test.each([ProposalState.Published, ProposalState.Voting])(
    'warns about %s proposals, without blocking',
    (state) => {
      proposals = [{ m: 1, state }]
      expect(meetingType.sm.checkGuards(meeting, 'close', t)).toEqual({
        text: 'proposal.meetingHasUnresolved'
      })
    }
  )

  test('ignores resolved proposals', () => {
    proposals = [
      { m: 1, state: ProposalState.Approved },
      { m: 1, state: ProposalState.Denied },
      { m: 1, state: ProposalState.Retracted }
    ]
    expect(meetingType.sm.checkGuards(meeting, 'close', t)).toBeUndefined()
  })

  test('ignores proposals in other meetings', () => {
    proposals = [{ m: 2, state: ProposalState.Published }]
    expect(meetingType.sm.checkGuards(meeting, 'close', t)).toBeUndefined()
  })
})
