import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, test, vi } from 'vitest'
import { computed, defineComponent } from 'vue'

// Breaks the ContentType <-> useContextRoles import cycle the same way the app does
import '@/composables/useContextRoles'
import useAuthStore from '../auth/useAuthStore'
import { matchedInviteType } from './contentTypes'
import useInviteStore from './useInviteStore'
import usePolledInvites from './usePolledInvites'

vi.mock('../auth/useAuthStore', async () => {
  const { defineStore } = await import('pinia')
  const { shallowRef } = await import('vue')
  return {
    default: defineStore('auth', () => ({
      user: shallowRef<{ pk: number } | undefined>({ pk: 1 })
    }))
  }
})

function mountComposable() {
  let result!: ReturnType<typeof usePolledInvites>
  const wrapper = mount(
    defineComponent({
      setup() {
        result = usePolledInvites()
        // Derived state, as the views use it
        const pks = computed(() => result.matchedInvites.value.map((i) => i.pk))
        return { pks }
      },
      template: '<div>{{ pks.join(",") }}</div>'
    })
  )
  return { result, wrapper }
}

const listSpy = vi.spyOn(matchedInviteType.api, 'list')

beforeEach(() => {
  setActivePinia(createPinia())
  listSpy.mockReset()
})

test('matchedInvites follows store updates', async () => {
  listSpy.mockResolvedValueOnce([{ pk: 1 }] as never)
  const { result, wrapper } = mountComposable()

  expect(result.invitesLoaded.value).toBe(false)
  await flushPromises()
  expect(result.invitesLoaded.value).toBe(true)
  expect(wrapper.text()).toBe('1')

  // A later poll replaces the list in the store
  listSpy.mockResolvedValueOnce([{ pk: 1 }, { pk: 2 }] as never)
  await useInviteStore().fetchMatchedInvites()
  await flushPromises()
  expect(wrapper.text()).toBe('1,2')

  useInviteStore().clearMatchedInvites()
  await flushPromises()
  expect(wrapper.text()).toBe('')
})

test('changing user clears invites and waits for a new load', async () => {
  listSpy.mockResolvedValueOnce([{ pk: 1 }] as never)
  const { result, wrapper } = mountComposable()
  await flushPromises()
  expect(wrapper.text()).toBe('1')

  let resolve!: (value: never) => void
  listSpy.mockReturnValueOnce(new Promise((r) => (resolve = r)))
  useAuthStore().user = { pk: 2 } as never
  await flushPromises()
  expect(result.invitesLoaded.value).toBe(false)
  expect(wrapper.text()).toBe('')

  resolve([{ pk: 3 }] as never)
  await flushPromises()
  expect(result.invitesLoaded.value).toBe(true)
  expect(wrapper.text()).toBe('3')
})
