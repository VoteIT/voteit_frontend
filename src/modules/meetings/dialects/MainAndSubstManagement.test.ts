import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { createI18n } from 'vue-i18n'

import router from '@/router'
import vuetify from '@/plugins/vuetify'
import MainAndSubstManagement from './MainAndSubstManagement.vue'

vi.mock('@/modules/active/useActive', () => {
  return {
    default() {
      return {
        activeUserIds: { value: [1] }
      }
    }
  }
})

test('Mount component', () => {
  expect(MainAndSubstManagement).toBeTruthy()
  const i18n = createI18n({
    legacy: false,
    messages: { en: {} }
  })
  // @ts-ignore
  const wrapper = mount(MainAndSubstManagement, {
    global: {
      plugins: [i18n, router, vuetify]
    },
    props: {
      group: {
        pk: 1,
        title: 'Group',
        body: '',
        delegate_to: null,
        groupid: 'group',
        meeting: 1,
        post_as: false,
        show_on_speaker: false,
        tags: [],
        votes: 2,
        memberships: [
          { m: 1, meeting_group: 1, pk: 1, user: 1, role: 1, votes: null },
          { m: 1, meeting_group: 1, pk: 2, user: 2, role: 1, votes: null }
        ]
      }
    }
  })
  expect(wrapper.html()).toMatchSnapshot()
  expect(wrapper.text()).toContain('1/2')
})
