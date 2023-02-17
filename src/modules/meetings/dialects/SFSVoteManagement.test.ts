import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { createI18n } from 'vue-i18n'
import router from '@/router'

import SFSVoteManagement from './SFSVoteManagement.vue'
import vuetify from '@/plugins/vuetify'

test('Mount component', () => {
  expect(SFSVoteManagement).toBeTruthy()
  const i18n = createI18n({
    legacy: false,
    messages: { en: {} }
  })
  // This does not test management, only number display
  const wrapper = mount(
    SFSVoteManagement,
    {
      global: {
        plugins: [i18n, router, vuetify]
      },
      props: {
        group: {
          votes: 123,
          memberships: [
            { votes: 3 },
            { votes: 2 }
          ]
        }
      }
    }
  )
  expect(wrapper.html()).toMatchSnapshot()
  expect(wrapper.text()).toContain('5/123')
  expect(wrapper.html()).not.toContain('</button>')
})
