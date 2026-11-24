import { beforeEach, describe, expect, test, vi } from 'vitest'

import { AgendaItem, AgendaState } from '../agendas/types'
import { Proposal, ProposalState } from './types'
import { canRetractProposal } from './rules'

const USER = 1
const OTHER_USER = 2
const GROUP = 5
const AGENDA_ITEM = 20

const state = vi.hoisted(() => ({
  agendaItem: undefined as AgendaItem | undefined,
  moderator: false,
  proposer: true,
  groupMembers: [] as number[]
}))

// rules.ts only needs types from here; the real module registers content types
vi.mock('./contentTypes', () => ({}))
vi.mock('../agendas/useAgendaStore', () => ({
  default: () => ({ getAgendaItem: () => state.agendaItem })
}))
vi.mock('@/modules/auth/useAuthStore', () => ({
  default: () => ({ user: { pk: USER } })
}))
vi.mock('../meetings/useGroupStore', () => ({
  default: () => ({
    isGroupMember: (group: number, user: number) =>
      group === GROUP && state.groupMembers.includes(user)
  })
}))
vi.mock('../meetings/rules', () => ({
  isArchivedMeeting: () => false,
  isFinishedMeeting: () => false,
  isModerator: () => state.moderator,
  isProposer: () => state.proposer
}))
vi.mock('../polls/usePollStore', () => ({ default: () => ({}) }))

function proposal(partial: Partial<Proposal> = {}): Proposal {
  return {
    pk: 1,
    agenda_item: AGENDA_ITEM,
    author: USER,
    meeting_group: null,
    state: ProposalState.Published,
    ...partial
  } as Proposal
}

const groupProposal = () =>
  proposal({ author: OTHER_USER, meeting_group: GROUP })

beforeEach(() => {
  state.agendaItem = {
    pk: AGENDA_ITEM,
    meeting: 10,
    state: AgendaState.Ongoing,
    block_proposals: false
  } as AgendaItem
  state.moderator = false
  state.proposer = true
  state.groupMembers = []
})

describe('canRetractProposal', () => {
  test('author with proposer role can retract', () => {
    expect(canRetractProposal(proposal())).toBe(true)
  })

  test('member of the authoring group with proposer role can retract', () => {
    state.groupMembers = [USER]
    expect(canRetractProposal(groupProposal())).toBe(true)
  })

  test('group member without proposer role cannot retract', () => {
    state.groupMembers = [USER]
    state.proposer = false
    expect(canRetractProposal(groupProposal())).toBe(false)
  })

  test('author without proposer role cannot retract', () => {
    state.proposer = false
    expect(canRetractProposal(proposal())).toBe(false)
  })

  test('neither author nor group member cannot retract', () => {
    state.groupMembers = [OTHER_USER]
    expect(canRetractProposal(groupProposal())).toBe(false)
    expect(canRetractProposal(proposal({ author: OTHER_USER }))).toBe(false)
  })

  test('group member cannot retract when proposals are blocked', () => {
    state.groupMembers = [USER]
    state.agendaItem = { ...state.agendaItem!, block_proposals: true }
    expect(canRetractProposal(groupProposal())).toBe(false)
  })

  test('moderator can retract any published proposal', () => {
    state.moderator = true
    state.proposer = false
    state.agendaItem = { ...state.agendaItem!, block_proposals: true }
    expect(canRetractProposal(proposal({ author: OTHER_USER }))).toBe(true)
  })

  test('no one can retract in a finished agenda item', () => {
    state.moderator = true
    state.agendaItem = { ...state.agendaItem!, state: AgendaState.Closed }
    expect(canRetractProposal(proposal())).toBe(false)
  })

  test('unpublished proposals cannot be retracted', () => {
    state.moderator = true
    expect(
      canRetractProposal(proposal({ state: ProposalState.Retracted }))
    ).toBe(false)
  })
})
