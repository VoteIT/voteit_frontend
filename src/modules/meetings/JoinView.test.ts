import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, expect, test, vi } from 'vitest'
import { shallowRef } from 'vue'

import vuetify from '@/plugins/vuetify'
import { openDialogEvent } from '@/utils/events'
import { ApiError } from '@/utils/restApi'
import JoinView from './JoinView.vue'
import { canBecomeModerator } from './rules'

const { mockPush, mockAddRoles, mockRetrieve, inviteState } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockAddRoles: vi.fn(),
  mockRetrieve: vi.fn(),
  inviteState: {} as {
    loaded: import('vue').Ref<boolean>
    invites: import('vue').ShallowRef<{ pk: number; meeting: number }[]>
  }
}))

vi.mock('../meetingInvites/usePolledInvites', () => ({
  default: () => ({
    invitesLoaded: inviteState.loaded,
    matchedInvites: inviteState.invites
  })
}))

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return { ...actual, useRouter: vi.fn(() => ({ push: mockPush })) }
})

vi.mock('./contentTypes', () => {
  // Transitively imported modules subscribe to these on import
  const mockChannel = () => ({ onLeave: vi.fn(), onSubscribe: vi.fn() })
  return {
    meetingType: {
      addRoles: mockAddRoles,
      useContextRoles: () => ({ getUserRoles: vi.fn(), hasRole: vi.fn() })
    },
    accessPolicyType: {
      api: { retrieve: mockRetrieve }
    },
    moderatorChannel: mockChannel(),
    participantChannel: mockChannel()
  }
})

vi.mock('./useMeeting', () => ({
  default: () => ({
    meetingId: shallowRef(1),
    meetingRoute: shallowRef({
      name: 'meeting',
      params: { id: 1, slug: 'test-meeting' }
    })
  })
}))

vi.mock('./useMeetings', () => ({ default: vi.fn() }))

vi.mock('./useMeetingStore', () => ({
  default: () => ({
    getMeeting: vi.fn().mockReturnValue({ pk: 1, title: 'Test Meeting' })
  })
}))

vi.mock('./rules', () => ({
  canBecomeModerator: vi.fn().mockReturnValue(true)
}))

vi.mock('../auth/useAuthStore', () => ({
  default: () => ({
    user: {
      pk: 99,
      first_name: 'Test',
      last_name: 'User',
      userid: 'testuser',
      email: 'test@test.com',
      image: null,
      img_url: null,
      organisation: 1,
      organisation_roles: []
    },
    isAuthenticated: true
  })
}))

vi.mock('../organisations/useOrgStore', () => ({
  default: () => ({
    canLogin: false,
    organisation: null,
    providers: [],
    primaryProvider: undefined,
    startLogin: () => {}
  })
}))

vi.mock('@/composables/useContextRoles', () => ({
  default: vi.fn().mockReturnValue({
    getUserRoles: vi.fn(),
    hasRole: vi.fn()
  })
}))

vi.mock('./accessPolicies', () => ({
  default: { automatic: { template: '<div class="access-policy" />' } }
}))

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return { ...actual, useI18n: () => ({ t: (key: string) => key }) }
})

const stubs = {
  AppBar: true,
  InviteCard: {
    props: ['invite'],
    template: '<div class="invite-card">{{ invite.pk }}</div>'
  },
  UserMenu: true,
  VMain: { template: '<div><slot /></div>' },
  QueryDialog: {
    template:
      '<div><slot name="activator" :props="{}"></slot>' +
      '<button class="query-confirm" @click="$emit(\'confirmed\')"></button></div>',
    emits: ['confirmed']
  }
}

function mountJoinView() {
  // @ts-ignore — vue-tsc cannot resolve mount overloads for script setup components
  return mount(JoinView, {
    global: { plugins: [vuetify], stubs, mocks: { $t: (key: string) => key } }
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
  inviteState.loaded = shallowRef(true)
  inviteState.invites = shallowRef([])
  mockPush.mockReset()
  mockAddRoles.mockReset()
  mockRetrieve.mockReset()
  vi.mocked(canBecomeModerator).mockReturnValue(true)
  mockRetrieve.mockResolvedValue({
    policies: [{ name: 'automatic', active: true }]
  })
})

test('redirects to meeting route when addRoles succeeds', async () => {
  mockAddRoles.mockResolvedValue(undefined)
  const wrapper = mountJoinView()
  await flushPromises()

  await wrapper.find('.query-confirm').trigger('click')
  await flushPromises()

  expect(mockAddRoles).toHaveBeenCalledWith(1, 99, 'mo')
  expect(mockPush).toHaveBeenCalledWith({
    name: 'meeting',
    params: { id: 1, slug: 'test-meeting' }
  })
})

test('opens error dialog with the roles error when addRoles fails', async () => {
  mockAddRoles.mockRejectedValue(
    new ApiError(
      400,
      { roles: ['Permission denied'] },
      new Headers(),
      'Bad Request'
    )
  )
  const dialogSpy = vi.spyOn(openDialogEvent, 'emit')
  const wrapper = mountJoinView()
  await flushPromises()

  await wrapper.find('.query-confirm').trigger('click')
  await flushPromises()

  expect(mockPush).not.toHaveBeenCalled()
  expect(dialogSpy).toHaveBeenCalledWith(
    expect.objectContaining({ title: 'Permission denied' })
  )
})

test('opens error dialog when the server rejects with a status error', async () => {
  mockAddRoles.mockRejectedValue(
    new ApiError(403, null, new Headers(), 'Forbidden')
  )
  const dialogSpy = vi.spyOn(openDialogEvent, 'emit')
  const wrapper = mountJoinView()
  await flushPromises()

  await wrapper.find('.query-confirm').trigger('click')
  await flushPromises()

  expect(mockPush).not.toHaveBeenCalled()
  expect(dialogSpy).toHaveBeenCalledWith(
    expect.objectContaining({ title: 'Forbidden (HTTP 403)' })
  )
})

test('shows progress and no actions until invitations have loaded', async () => {
  inviteState.loaded.value = false
  const wrapper = mountJoinView()

  expect(wrapper.find('.v-progress-linear').exists()).toBe(true)
  expect(wrapper.find('.query-confirm').exists()).toBe(false)

  inviteState.loaded.value = true
  await flushPromises()

  expect(wrapper.find('.v-progress-linear').exists()).toBe(false)
  expect(wrapper.find('.query-confirm').exists()).toBe(true)
})

test('shows invitations for this meeting only', async () => {
  inviteState.invites.value = [
    { pk: 10, meeting: 1 },
    { pk: 11, meeting: 2 }
  ]
  const wrapper = mountJoinView()
  await flushPromises()

  const cards = wrapper.findAll('.invite-card')
  expect(cards).toHaveLength(1)
  expect(cards[0].text()).toBe('10')
  // Org managers may still join as moderator
  expect(wrapper.find('.query-confirm').exists()).toBe(true)
})

test('shows access policies when not invited', async () => {
  const wrapper = mountJoinView()
  await flushPromises()

  expect(wrapper.find('.access-policy').exists()).toBe(true)
})

test('hides access policies when invited', async () => {
  inviteState.invites.value = [{ pk: 10, meeting: 1 }]
  const wrapper = mountJoinView()
  await flushPromises()

  expect(wrapper.find('.invite-card').exists()).toBe(true)
  expect(wrapper.find('.access-policy').exists()).toBe(false)

  // Rejecting the invitation brings them back
  inviteState.invites.value = []
  await flushPromises()
  expect(wrapper.find('.access-policy').exists()).toBe(true)
})

test('sends user home when the meeting is not found', async () => {
  vi.mocked(canBecomeModerator).mockReturnValue(false)
  mockRetrieve.mockRejectedValue(
    new ApiError(404, null, new Headers(), 'Not Found')
  )
  const dialogSpy = vi.spyOn(openDialogEvent, 'emit')
  const wrapper = mountJoinView()
  await flushPromises()

  expect(dialogSpy).toHaveBeenCalledOnce()
  // No way in while the dialog is up
  expect(wrapper.find('.v-progress-linear').exists()).toBe(true)
  expect(wrapper.find('.query-confirm').exists()).toBe(false)

  dialogSpy.mock.calls[0][0].resolve(true)
  expect(mockPush).toHaveBeenCalledWith({ name: 'home' })
})

test('lets user retry when loading access policies fails', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  mockRetrieve.mockRejectedValueOnce(
    new ApiError(500, null, new Headers(), 'Server Error')
  )
  const dialogSpy = vi.spyOn(openDialogEvent, 'emit')
  const wrapper = mountJoinView()
  await flushPromises()

  expect(dialogSpy).not.toHaveBeenCalled()
  expect(wrapper.find('.access-policy').exists()).toBe(false)
  expect(wrapper.text()).not.toContain('join.noAccess')
  // Other ways in still work
  expect(wrapper.find('.query-confirm').exists()).toBe(true)

  await wrapper.find('.retry-policies').trigger('click')
  await flushPromises()

  expect(mockRetrieve).toHaveBeenCalledTimes(2)
  expect(wrapper.find('.retry-policies').exists()).toBe(false)
  expect(wrapper.find('.access-policy').exists()).toBe(true)
})

test('an invitation gives access to a meeting the server will not show', async () => {
  vi.mocked(canBecomeModerator).mockReturnValue(false)
  mockRetrieve.mockRejectedValue(
    new ApiError(404, null, new Headers(), 'Not Found')
  )
  inviteState.invites.value = [{ pk: 10, meeting: 1 }]
  const dialogSpy = vi.spyOn(openDialogEvent, 'emit')
  const wrapper = mountJoinView()
  await flushPromises()

  expect(dialogSpy).not.toHaveBeenCalled()
  expect(wrapper.find('.invite-card').exists()).toBe(true)
  expect(wrapper.text()).not.toContain('join.noAccess')

  // Without the invitation there's no way in
  inviteState.invites.value = []
  await flushPromises()
  expect(dialogSpy).toHaveBeenCalledOnce()
})

test('org managers may join a meeting the server will not show', async () => {
  mockRetrieve.mockRejectedValue(
    new ApiError(404, null, new Headers(), 'Not Found')
  )
  mockAddRoles.mockResolvedValue(undefined)
  const dialogSpy = vi.spyOn(openDialogEvent, 'emit')
  const wrapper = mountJoinView()
  await flushPromises()

  expect(dialogSpy).not.toHaveBeenCalled()
  await wrapper.find('.query-confirm').trigger('click')
  await flushPromises()
  expect(mockAddRoles).toHaveBeenCalledWith(1, 99, 'mo')
})
