import { mount } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'
import { ref } from 'vue'
import { createI18n } from 'vue-i18n'

import vuetify from '@/plugins/vuetify'
import SearchableUserList from './SearchableUserList.vue'

const users: Record<
  number,
  { first_name: string; last_name: string; userid: string }
> = {
  1: { first_name: 'Örjan', last_name: 'Ek', userid: 'orjan' },
  2: { first_name: 'Anna', last_name: 'Berg', userid: 'anna' },
  3: { first_name: 'Cecilia', last_name: 'Dahl', userid: 'cissi' },
  4: { first_name: 'bertil', last_name: 'Ås', userid: 'bertil' },
  5: { first_name: 'David', last_name: 'Lund', userid: 'david' },
  6: { first_name: 'Eva', last_name: 'Holm', userid: 'eva' },
  7: { first_name: 'Äsa', last_name: 'Ek', userid: 'asa' },
  8: { first_name: 'Åke', last_name: 'Ek', userid: 'ake' }
}

// Avoid the store import chain; the default item slot isn't rendered here
vi.mock('./User.vue', () => ({ default: { template: '<span />' } }))
vi.mock('@/modules/meetings/useMeetingId', () => ({ default: () => ref(1) }))
vi.mock('@/modules/organisations/useUserDetails', () => ({
  default: () => ({ getUser: (pk: number) => users[pk] })
}))

function mountList(pks: number[], locale = 'en') {
  const i18n = createI18n({ legacy: false, locale, messages: { en: {} } })
  return mount(SearchableUserList, {
    global: { plugins: [i18n, vuetify] },
    props: { items: pks.map((user) => ({ user })) },
    slots: {
      item: `<template #item="{ item }"><div class="row">{{ item.user }}</div></template>`
    }
  })
}

function renderedUsers(wrapper: ReturnType<typeof mountList>) {
  return wrapper.findAll('.row').map((row) => Number(row.text()))
}

describe('SearchableUserList', () => {
  test('no search field with 5 items', () => {
    const wrapper = mountList([1, 2, 3, 4, 5])
    expect(wrapper.find('input').exists()).toBe(false)
  })

  test('search field with more than 5 items', () => {
    const wrapper = mountList([1, 2, 3, 4, 5, 6])
    expect(wrapper.find('input').exists()).toBe(true)
  })

  test('sorted by name, case insensitive', () => {
    const wrapper = mountList([1, 2, 3, 4, 5, 6])
    expect(renderedUsers(wrapper)).toEqual([2, 4, 3, 5, 6, 1])
  })

  test('filters on name and userid', async () => {
    const wrapper = mountList([1, 2, 3, 4, 5, 6])
    await wrapper.find('input').setValue('cissi')
    expect(renderedUsers(wrapper)).toEqual([3])
    await wrapper.find('input').setValue('HOLM')
    expect(renderedUsers(wrapper)).toEqual([6])
  })

  test('sorted by locale', () => {
    const wrapper = mountList([1, 7, 8], 'sv')
    expect(renderedUsers(wrapper)).toEqual([8, 7, 1])
  })
})
