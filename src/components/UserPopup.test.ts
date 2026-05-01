import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { ref } from 'vue'
import { createI18n } from 'vue-i18n'
import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'

import router from '@/router'
import vuetify from '@/plugins/vuetify'
import UserPopup from './UserPopup.vue'
import useGroupStore from '@/modules/meetings/useGroupStore'
import useProposalStore from '@/modules/proposals/useProposalStore'
import useAgendaStore from '@/modules/agendas/useAgendaStore'
import { type IUser } from '@/modules/organisations/types'
import { ProposalState } from '@/modules/proposals/types'
import { AgendaState } from '@/modules/agendas/types'

vi.mock('@/modules/meetings/useMeetingId', () => ({
  default: () => ref(42)
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      meeting: { groups: { count: 'No groups | One group | {count} groups' } },
      proposal: {
        countInMeeting: 'No proposals | One proposal | {count} proposals'
      }
    }
  }
})

// Stub VMenu to always render its content, bypassing teleport and
// open/close mechanics that don't work in the test environment.
// Stub VListItem to avoid router resolution for :to props.
const stubs = {
  VMenu: {
    template: '<div><slot name="activator" :props="{}" /><slot /></div>'
  },
  VListItem: {
    template: '<li>{{ title }}<span v-if="subtitle">{{ subtitle }}</span></li>',
    props: ['title', 'subtitle', 'to', 'prependIcon']
  }
}

const user: IUser = {
  pk: 1,
  first_name: 'Anna',
  last_name: 'Svensson',
  userid: 'annas',
  email: 'anna@example.com',
  image: null,
  img_url: null
}

function makeGroup(pk: number, title: string, rolePk: number | null = null) {
  return {
    pk,
    title,
    meeting: 42,
    body: '',
    delegate_to: null,
    groupid: `group-${pk}`,
    post_as: true,
    show_on_speaker: false,
    tags: [],
    votes: null,
    members: [user.pk],
    memberships: [
      {
        pk: 200 + pk,
        meeting_group: pk,
        user: user.pk,
        role: rolePk,
        votes: null,
        m: 42
      }
    ]
  }
}

function makeProposal(pk: number, agendaItemPk: number) {
  return {
    pk,
    m: 42,
    agenda_item: agendaItemPk,
    author: user.pk,
    as_group: false as const,
    meeting_group: null,
    prop_id: `A${pk}`,
    title: '',
    name: '',
    body: '',
    created: '',
    modified: '',
    shortname: 'proposal' as const,
    state: ProposalState.Published,
    tags: []
  }
}

function makeAgendaItem(pk: number, title: string) {
  return {
    pk,
    title,
    meeting: 42,
    block_proposals: false,
    block_discussion: false,
    order: 1,
    related_modified: null,
    state: AgendaState.Upcoming,
    tags: []
  }
}

function mountWithData(
  overrides: {
    groups?: ReturnType<typeof makeGroup>[]
    groupRole?: { pk: number; title: string } | undefined
    proposals?: ReturnType<typeof makeProposal>[]
    agendaItems?: ReturnType<typeof makeAgendaItem>[]
  } = {}
) {
  // Set up mocks before mount so computed properties don't fire with undefined.
  const pinia = createTestingPinia()
  setActivePinia(pinia)
  useGroupStore().getUserGroups = vi
    .fn()
    .mockReturnValue(overrides.groups ?? [])
  useGroupStore().getGroupRole = vi.fn().mockReturnValue(overrides.groupRole)
  useProposalStore().filterProposals = vi
    .fn()
    .mockReturnValue(overrides.proposals ?? [])
  useAgendaStore().getAgendaItems = vi
    .fn()
    .mockReturnValue(overrides.agendaItems ?? [])

  // @ts-ignore — vue-tsc cannot resolve mount overloads for script setup components
  return mount(UserPopup, {
    global: { plugins: [i18n, router, vuetify, pinia], stubs },
    props: { user }
  })
}

test('shows user name and userid in card header', () => {
  const wrapper = mountWithData()

  expect(wrapper.text()).toContain('Anna Svensson')
  expect(wrapper.text()).toContain('annas')
})

test('shows groups and agenda item when user has both', async () => {
  const rolePk = 5
  const wrapper = mountWithData({
    groups: [
      makeGroup(10, 'Board', rolePk),
      makeGroup(11, 'Nominating committee')
    ],
    groupRole: { pk: rolePk, title: 'Chair' },
    proposals: [makeProposal(100, 20), makeProposal(101, 20)],
    agendaItems: [makeAgendaItem(20, 'Budget 2025')]
  })
  await wrapper.vm.$nextTick()

  expect(wrapper.text()).toContain('2 proposals')
  expect(wrapper.text()).toContain('Board')
  expect(wrapper.text()).toContain('Chair')
  expect(wrapper.text()).toContain('Nominating committee')
  expect(wrapper.text()).toContain('Budget 2025')
})

test('shows groups even when user has no proposals', async () => {
  const wrapper = mountWithData({
    groups: [makeGroup(10, 'Board'), makeGroup(11, 'Nominating committee')]
  })
  await wrapper.vm.$nextTick()

  expect(wrapper.text()).toContain('Board')
  expect(wrapper.text()).toContain('Nominating committee')
  expect(wrapper.find('.v-list').exists()).toBe(true)
})

test('hides list when user has neither groups nor proposals', () => {
  const wrapper = mountWithData()

  expect(wrapper.find('.v-list').exists()).toBe(false)
})
