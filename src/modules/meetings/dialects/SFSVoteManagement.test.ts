import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { createI18n } from 'vue-i18n'
import { createTestingPinia } from '@pinia/testing'

import router from '@/router'
import vuetify from '@/plugins/vuetify'
import SFSVoteManagement from './SFSVoteManagement.vue'

test('Mount component', () => {
  expect(SFSVoteManagement).toBeTruthy()
  const i18n = createI18n({
    legacy: false,
    messages: { en: {} }
  })
  // This does not test management, only number display
  // @ts-ignore
  const wrapper = mount(SFSVoteManagement, {
    global: {
      plugins: [i18n, router, vuetify, createTestingPinia()]
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
        votes: 123,
        memberships: [
          { m: 1, meeting_group: 1, pk: 1, user: 1, votes: 3, role: 1 },
          { m: 1, meeting_group: 1, pk: 2, user: 2, votes: 2, role: 1 }
        ]
      }
    }
  })
  expect(wrapper.html()).toMatchSnapshot()
  expect(wrapper.text()).toContain('5/123')
  expect(wrapper.html()).not.toContain('</button>')
})
