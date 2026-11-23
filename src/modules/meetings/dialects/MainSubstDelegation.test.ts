import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'

import router from '@/router'
import vuetify from '@/plugins/vuetify'
import MainSubstDelegation from './MainSubstDelegation.vue'

test('Mount component', () => {
  const i18n = createI18n({
    legacy: false,
    messages: { en: {} }
  })
  const wrapper = mount(MainSubstDelegation, {
    global: {
      plugins: [createPinia(), i18n, router, vuetify]
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
          { m: 1, meeting_group: 1, pk: 1, user: 1, role: 1, votes: null }
        ]
      }
    }
  })
  // No group roles loaded, so no voting members
  expect(wrapper.text()).toBe('-')
})
