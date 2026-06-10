import { describe, expect, test, vi } from 'vitest'
import { ref } from 'vue'

const { agendaItems } = vi.hoisted(() => {
  const agendaItems = [
    {
      pk: 1,
      meeting: 1,
      order: 1,
      state: 'upcoming',
      title: 'Item 1',
      tags: [],
      block_proposals: false,
      block_discussion: false,
      related_modified: null
    },
    {
      pk: 2,
      meeting: 1,
      order: 2,
      state: 'upcoming',
      title: 'Item 2',
      tags: [],
      block_proposals: false,
      block_discussion: false,
      related_modified: null
    },
    {
      pk: 3,
      meeting: 1,
      order: 3,
      state: 'upcoming',
      title: 'Item 3',
      tags: [],
      block_proposals: false,
      block_discussion: false,
      related_modified: null
    }
  ]
  return { agendaItems }
})

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { aid: '1' } })
}))

vi.mock('./useAgendaStore', () => ({
  default: () => ({
    getAgendaItem: (pk: number) => agendaItems.find((i) => i.pk === pk),
    getAgendaItems: (predicate: (ai: (typeof agendaItems)[0]) => boolean) =>
      agendaItems.filter(predicate),
    getAgendaBody: vi.fn().mockReturnValue(undefined),
    getLastRead: vi.fn().mockReturnValue(undefined)
  })
}))

vi.mock('../meetings/useMeeting', () => ({
  default: () => ({ meeting: ref(null), meetingId: ref(1) })
}))

vi.mock('../proposals/useProposalStore', () => ({
  default: () => ({ anyProposal: vi.fn().mockReturnValue(false) })
}))

vi.mock('../polls/usePollStore', () => ({
  default: () => ({ allPollTitles: [], anyPoll: vi.fn().mockReturnValue(false) })
}))

vi.mock('../discussions/rules', () => ({
  canAddDiscussionPost: vi.fn().mockReturnValue(false)
}))

vi.mock('../polls/rules', () => ({
  canAddPoll: vi.fn().mockReturnValue(false)
}))

vi.mock('../proposals/rules', () => ({
  canAddProposal: vi.fn().mockReturnValue(false),
  canAddDocument: vi.fn().mockReturnValue(false),
  getProposalBlockReason: vi.fn().mockReturnValue(undefined)
}))

vi.mock('./rules', () => ({
  canChangeAgendaItem: vi.fn().mockReturnValue(false)
}))

import useAgendaItem from './useAgendaItem'

describe('previousAgendaItem', () => {
  test('returns undefined when on the first item', () => {
    // Regression: agenda.at(-1) wraps to the last item; bracket access returns undefined
    const { previousAgendaItem } = useAgendaItem(ref(1))
    expect(previousAgendaItem.value).toBeUndefined()
  })

  test('returns the preceding item when not at the start', () => {
    const { previousAgendaItem } = useAgendaItem(ref(2))
    expect(previousAgendaItem.value).toBe(agendaItems[0])
  })
})

describe('nextAgendaItem', () => {
  test('returns undefined when on the last item', () => {
    const { nextAgendaItem } = useAgendaItem(ref(3))
    expect(nextAgendaItem.value).toBeUndefined()
  })

  test('returns the following item when not at the end', () => {
    const { nextAgendaItem } = useAgendaItem(ref(2))
    expect(nextAgendaItem.value).toBe(agendaItems[2])
  })
})
