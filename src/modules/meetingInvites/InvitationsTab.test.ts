import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { beforeEach, expect, test, vi } from 'vitest'
import { computed, ref } from 'vue'

import vuetify from '@/plugins/vuetify'

import { MeetingRole } from '../meetings/types'
import { MeetingInvite, MeetingInviteState } from './types'
import InvitationsTab from './InvitationsTab.vue'

const { mockAlert, mockBulkDelete, mockBulkRevoke, mockListAction } =
  vi.hoisted(() => ({
    mockAlert: vi.fn(),
    mockBulkDelete: vi.fn(),
    mockBulkRevoke: vi.fn(),
    mockListAction: vi.fn()
  }))

// The invites the store would hold. Tests mutate this to stand in for the socket
// updates that follow a bulk action.
const invites = ref<MeetingInvite[]>([])

vi.mock('./useMeetingInvites', () => ({
  default: () => ({ meetingInvites: computed(() => invites.value) })
}))

vi.mock('./useInviteStore', () => ({
  default: () => ({ bulkDelete: mockBulkDelete, bulkRevoke: mockBulkRevoke })
}))

vi.mock('./contentTypes', () => ({
  inviteChannel: { onLeave: vi.fn(), onSubscribe: vi.fn() },
  meetingInviteType: {
    api: { listAction: mockListAction },
    sm: {
      getStateList: () => [
        { state: 'open', translate: () => 'Open' },
        { state: 'revoked', translate: () => 'Revoked' }
      ]
    }
  }
}))

vi.mock('./utils', () => ({
  translateInviteType: () => ({ label: 'Email', typeLabel: 'Email' })
}))

vi.mock('../organisations/registry', () => {
  const email = { id: 'email', icon: 'mdi-email' }
  return {
    invitationScopes: {
      getActivePlugins: () => [email],
      getPlugin: () => email
    }
  }
})

vi.mock('../meetings/useMeeting', () => ({
  default: () => ({
    isModerator: ref(true),
    meetingId: ref(1),
    roleLabelsEditable: {}
  })
}))

vi.mock('../meetings/rules', () => ({ canDeleteMeetingInvite: () => true }))
vi.mock('../meetings/utils', () => ({
  getMeetingRoleIcon: () => 'mdi-account',
  translateMeetingRole: (role: string) => role
}))

vi.mock('@/socket/useChannel', () => ({
  default: () => ({ subscribed: ref(true) })
}))
vi.mock('@/composables/usePermission', () => ({ default: vi.fn() }))
vi.mock('@/composables/useAlert', () => ({
  default: () => ({ alert: mockAlert })
}))

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return { ...actual, useI18n: () => ({ t: (key: string) => key }) }
})

// Module-level stubs: these SFCs pull in contentType/auth chains this test has no
// need to set up.
vi.mock('@/components/inputs/CheckboxMultipleSelect.vue', () => ({
  default: { props: ['modelValue', 'settings', 'label'], template: '<div />' }
}))
vi.mock('./InvitationModal.vue', () => ({ default: { template: '<div />' } }))
vi.mock('./InvitationAnnotation.vue', () => ({
  default: { props: ['invite'], template: '<div />' }
}))
vi.mock('@/components/DefaultDialog.vue', () => ({
  default: {
    name: 'DefaultDialog',
    props: ['title', 'width'],
    template: '<div><slot name="activator" :props="{}" /></div>'
  }
}))
// Stands in for the confirmation dialog, so a test can confirm without opening it
vi.mock('@/components/QueryDialog.vue', () => ({
  default: {
    name: 'QueryDialog',
    props: ['text', 'color'],
    emits: ['confirmed'],
    template: '<div><slot name="activator" :props="{}" /></div>'
  }
}))

function invite(pk: number, email: string, has_annotations = false) {
  return {
    pk,
    has_annotations,
    user_data: { email },
    meeting: 1,
    organisation_pk: 1,
    roles: [MeetingRole.Participant],
    state: MeetingInviteState.Open,
    used_by: null
  } satisfies MeetingInvite
}

async function mountTab() {
  // @ts-ignore — vue-tsc cannot resolve mount overloads for script setup components
  const wrapper = mount(InvitationsTab, {
    global: { plugins: [vuetify], mocks: { $t: (key: string) => key } }
  })
  await flushPromises()
  return wrapper
}

/** Check the row checkbox for every given invite pk, in table order. */
async function select(wrapper: VueWrapper, ...pks: number[]) {
  const rows = wrapper.findAll('tbody tr')
  for (const pk of pks) {
    const row = rows.find((r) => r.text().includes(`${pk}@test.com`))
    if (!row) throw new Error(`No visible row for invite ${pk}`)
    const checkbox = row.find('input[type="checkbox"]')
    // Clicking toggles, so leave an already selected row alone
    if (!(checkbox.element as HTMLInputElement).checked)
      await checkbox.trigger('click')
  }
  await flushPromises()
}

function selectedPks(wrapper: VueWrapper) {
  return wrapper
    .findAll('tbody tr')
    .filter(
      (r) =>
        (r.find('input[type="checkbox"]').element as HTMLInputElement).checked
    )
    .map((r) => Number(r.text().match(/(\d+)@test\.com/)![1]))
}

async function setSearch(wrapper: VueWrapper, search: string) {
  await wrapper.findComponent({ name: 'VTextField' }).setValue(search)
  await flushPromises()
}

/** Confirm the bulk dialog whose text matches the given translation key. */
async function confirm(wrapper: VueWrapper, key: string) {
  const dialog = wrapper
    .findAllComponents({ name: 'QueryDialog' })
    .find((d) => d.props('text') === key)
  if (!dialog) throw new Error(`No query dialog for ${key}`)
  dialog.vm.$emit('confirmed')
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  invites.value = [invite(1, '1@test.com'), invite(2, '2@test.com')]
  // Deleting drops the invites from the store, as the socket update would
  mockBulkDelete.mockImplementation(async (_meeting: number, pks: number[]) => {
    invites.value = invites.value.filter(({ pk }) => !pks.includes(pk))
  })
})

test('Deleting twice in a row only sends the invites still selected', async () => {
  const wrapper = await mountTab()

  await select(wrapper, 1)
  await confirm(wrapper, 'invites.confirmDelete')
  expect(mockBulkDelete).toHaveBeenCalledWith(1, [1])

  // Invite 1 is gone, so its pk must not travel with the next delete
  expect(selectedPks(wrapper)).toEqual([])
  await select(wrapper, 2)
  await confirm(wrapper, 'invites.confirmDelete')
  expect(mockBulkDelete).toHaveBeenLastCalledWith(1, [2])
  expect(mockAlert).not.toHaveBeenCalled()
})

test('Deleting only sends invites matching the current search', async () => {
  const wrapper = await mountTab()

  await setSearch(wrapper, '1@test.com')
  await select(wrapper, 1)
  // Selecting under one search and deleting under another must not delete both
  await setSearch(wrapper, '2@test.com')
  await select(wrapper, 2)
  await confirm(wrapper, 'invites.confirmDelete')

  expect(mockBulkDelete).toHaveBeenCalledWith(1, [2])
})

test('Revoking only sends invites in view, and keeps the selection', async () => {
  const wrapper = await mountTab()

  await setSearch(wrapper, '1@test.com')
  await select(wrapper, 1)
  await setSearch(wrapper, '2@test.com')
  await select(wrapper, 2)
  await confirm(wrapper, 'invites.confirmRevoke')

  expect(mockBulkRevoke).toHaveBeenCalledWith(1, [2])
  // Nothing was removed, so the selection stands
  expect(selectedPks(wrapper)).toEqual([2])
})

test('Clearing annotations only sends annotated invites in view', async () => {
  invites.value = [
    invite(1, '1@test.com', true),
    invite(2, '2@test.com', true),
    invite(3, '3@test.com')
  ]
  const wrapper = await mountTab()

  await setSearch(wrapper, '1@test.com')
  await select(wrapper, 1)
  await setSearch(wrapper, '')
  await select(wrapper, 2, 3)
  await confirm(wrapper, 'invites.confirmClearAnnotations')

  expect(mockListAction).toHaveBeenCalledWith('clear-annotations', {
    invites: [1, 2],
    meeting: 1
  })
  expect(selectedPks(wrapper)).toEqual([1, 2, 3])
})

test('A failed delete keeps the selection and alerts', async () => {
  const wrapper = await mountTab()
  mockBulkDelete.mockRejectedValueOnce(new Error('nope'))

  await select(wrapper, 1)
  await confirm(wrapper, 'invites.confirmDelete')

  expect(mockAlert).toHaveBeenCalledWith('^invites.errorDelete')
  expect(selectedPks(wrapper)).toEqual([1])
})

test('A remote delete of part of the selection leaves the rest deletable', async () => {
  const wrapper = await mountTab()

  await select(wrapper, 1, 2)
  // Another client deletes invite 1, so the socket drops it from the store
  invites.value = invites.value.filter(({ pk }) => pk !== 1)
  await flushPromises()
  await confirm(wrapper, 'invites.confirmDelete')

  expect(mockBulkDelete).toHaveBeenCalledWith(1, [2])
  expect(mockAlert).not.toHaveBeenCalled()
})

test('A remote delete of the whole selection sends no request at all', async () => {
  const wrapper = await mountTab()

  await select(wrapper, 1, 2)
  // Both invites are deleted elsewhere while the confirmation dialog is open
  invites.value = []
  await flushPromises()
  await confirm(wrapper, 'invites.confirmDelete')
  await confirm(wrapper, 'invites.confirmRevoke')
  await confirm(wrapper, 'invites.confirmClearAnnotations')

  expect(mockBulkDelete).not.toHaveBeenCalled()
  expect(mockBulkRevoke).not.toHaveBeenCalled()
  expect(mockListAction).not.toHaveBeenCalled()
})
