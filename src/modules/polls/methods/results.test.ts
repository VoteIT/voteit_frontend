import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { createI18n } from 'vue-i18n'

import router from '@/router'
import vuetify from '@/plugins/vuetify'
import DuttResult from './DuttResult.vue'
import SimpleResult from './SimpleResult.vue'

const i18n = createI18n({
  legacy: false,
  messages: { en: { poll: { result: { voteCount: 'Vote count: {count}' } } } }
})

const global = {
  plugins: [i18n, router, vuetify]
}

vi.mock('@/modules/proposals/useProposals', () => {
  return {
    default () {
      return {
        getProposal (pk: number) {
          return {
            pk,
            body: `<p>Proposal ${pk}</p>`,
            proposal_id: `prop-${pk}`,
            shortname: 'proposal',
            tags: []
          }
        }
      }
    }
  }
})

test('DuttResult component', () => {
  expect(DuttResult).toBeTruthy()
  // This does not test management, only number display
  const wrapper = mount(
    DuttResult,
    {
      global,
      props: {
        abstainCount: 3,
        proposals: [1, 2, 3],
        result: {
          approved: [],
          denied: [],
          vote_count: 123,
          results: [
            { proposal: 1, votes: 12 },
            { proposal: 2, votes: 13 },
            { proposal: 3, votes: 15 }
          ]
        }
      }
    }
  )
  expect(wrapper.html()).toMatchSnapshot()
  expect(wrapper.text()).toContain('Proposal 1')
  expect(wrapper.text()).toContain('Vote count: 12')
})

test('SimpleResult component', () => {
  expect(SimpleResult).toBeTruthy()
  // This does not test management, only number display
  const wrapper = mount(
    SimpleResult,
    {
      global,
      props: {
        abstainCount: 3,
        proposals: [1, 2, 3],
        result: {
          approved: [1],
          denied: [2, 3],
          vote_count: 123,
          results: {
            1: {
              abstain: 1,
              no: 3,
              yes: 6
            },
            2: {
              abstain: 1,
              no: 6,
              yes: 3
            },
            3: {
              abstain: 2,
              no: 6,
              yes: 2
            }
          }
        }
      }
    }
  )
  expect(wrapper.html()).toMatchSnapshot()
  expect(wrapper.text()).toContain('Proposal 1')
  expect(wrapper.text()).toContain('33 %')
})
