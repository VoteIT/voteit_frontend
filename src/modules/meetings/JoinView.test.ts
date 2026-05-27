import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, expect, test, vi } from 'vitest'
import { ref } from 'vue'

import vuetify from '@/plugins/vuetify'
import { openDialogEvent } from '@/utils/events'
import JoinView from './JoinView.vue'

const { mockPush, mockAddRoles } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockAddRoles: vi.fn()
}))

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return { ...actual, useRouter: vi.fn(() => ({ push: mockPush })) }
})

vi.mock('./contentTypes', () => ({
  meetingType: {
    addRoles: mockAddRoles,
    useContextRoles: () => ({ getUserRoles: vi.fn(), hasRole: vi.fn() })
  },
  accessPolicyType: {
    api: { retrieve: vi.fn().mockResolvedValue({ data: { policies: [] } }) }
  }
}))

vi.mock('./useMeeting', () => ({
  default: () => ({
    meetingId: ref(1),
    meetingRoute: ref({
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
  default: () => ({ loginURL: null, canLogin: false, organisation: null })
}))

vi.mock('@/composables/useLoader', () => ({
  default: vi.fn().mockReturnValue({ call: vi.fn() })
}))

vi.mock('@/composables/useContextRoles', () => ({
  default: vi.fn().mockReturnValue({
    getUserRoles: vi.fn(),
    hasRole: vi.fn()
  })
}))

vi.mock('./accessPolicies', () => ({ default: {} }))

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return { ...actual, useI18n: () => ({ t: (key: string) => key }) }
})

const stubs = {
  AppBar: true,
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
  mockPush.mockReset()
  mockAddRoles.mockReset()
})

test('redirects to meeting route when addRoles succeeds', async () => {
  mockAddRoles.mockResolvedValue(undefined)
  const wrapper = mountJoinView()

  await wrapper.find('.query-confirm').trigger('click')
  await flushPromises()

  expect(mockAddRoles).toHaveBeenCalledWith(1, 99, 'mo')
  expect(mockPush).toHaveBeenCalledWith({
    name: 'meeting',
    params: { id: 1, slug: 'test-meeting' }
  })
})

test('opens error dialog when addRoles fails', async () => {
  mockAddRoles.mockRejectedValue(new Error('Permission denied'))
  const dialogSpy = vi.spyOn(openDialogEvent, 'emit')
  const wrapper = mountJoinView()

  await wrapper.find('.query-confirm').trigger('click')
  await flushPromises()

  expect(mockPush).not.toHaveBeenCalled()
  expect(dialogSpy).toHaveBeenCalled()
})
