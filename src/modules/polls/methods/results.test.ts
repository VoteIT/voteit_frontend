import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'

import router from '@/router'
import vuetify from '@/plugins/vuetify'
import DuttResult from './DuttResult.vue'
import MajorityResult from './MajorityResult.vue'
import RepeatedIRVResult from './RepeatedIRVResult.vue'
import RepeatedSchulzeResult from './RepeatedSchulzeResult.vue'
import SchulzeResult from './SchulzeResult.vue'
import SimpleResult from './SimpleResult.vue'
import STVResult from './STVResult.vue'

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
            created: new Date().toISOString(),
            body: `<p>Proposal ${pk}</p>`,
            pk,
            prop_id: `prop-${pk}`,
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

test('MajorityResult component', () => {
  expect(MajorityResult).toBeTruthy()
  const wrapper = mount(
    MajorityResult,
    {
      global,
      props: {
        abstainCount: 3,
        proposals: [1, 2],
        result: {
          approved: [2],
          denied: [1],
          results: [
            {
              proposal: 1,
              votes: 12
            },
            {
              proposal: 2,
              votes: 13
            }
          ]
        }
      }
    }
  )
  expect(wrapper.html()).toMatchSnapshot()
  expect(wrapper.text()).toContain('Proposal 1')
  expect(wrapper.text()).toContain('Vote count: 12')
})

test('RepeatedIRVResult component', async () => {
  expect(RepeatedIRVResult).toBeTruthy()
  const wrapper = mount(
    RepeatedIRVResult,
    {
      global,
      props: {
        abstainCount: 3,
        proposals: [1, 2, 3],
        result: {
          approved: [1, 2],
          denied: [3],
          quota: 123,
          complete: true,
          randomized: false,
          rounds: [
            {
              status: 'Elected',
              selected: [1],
              method: 'Direct'
            },
            {
              status: 'Elected',
              selected: [2],
              method: 'Direct'
            }
          ],
          runtime: 0.0123
        }
      }
    }
  )
  expect(wrapper.html()).toMatchSnapshot()
  expect(wrapper.text()).toContain('#prop-1')
  wrapper.find('button').trigger('click')
  await nextTick()
  expect(wrapper.text()).toContain('poll.IRV.repeatedRoundResult')
})

test('RepeatedSchulzeResult component', async () => {
  expect(RepeatedSchulzeResult).toBeTruthy()
  const wrapper = mount(
    RepeatedSchulzeResult,
    {
      global,
      props: {
        abstainCount: 3,
        proposals: [1, 2, 3],
        result: {
          approved: [1, 2],
          candidates: [1, 2, 3],
          denied: [3],
          votes: 4,
          rounds: [
            {
              approved: [1],
              denied: [2, 3],
              winner: 1,
              candidates: [1, 2, 3],
              pairs: [
                [[1, 2], 3],
                [[1, 3], 4],
                [[2, 1], 1],
                [[2, 3], 4],
                [[3, 1], 0],
                [[3, 2], 0]
              ],
              strong_pairs: [],
              votes: 4
            },
            {
              approved: [2],
              denied: [3],
              winner: 2,
              candidates: [2, 3],
              pairs: [
                [[2, 3], 4],
                [[3, 2], 0]
              ],
              strong_pairs: [],
              votes: 4
            }
          ]
        }
      }
    }
  )
  wrapper.find('button').trigger('click')
  await nextTick()
  wrapper.find('.v-expansion-panel-text button').trigger('click')
  await nextTick()
  expect(wrapper.html()).toMatchSnapshot()
  expect(wrapper.text()).toContain('#prop-1')
  expect(wrapper.text()).toContain('75 % 0 % 25 %')
  expect(wrapper.text()).toContain('100 % 0 % 0 %')
})

test('SchulzeResult component', async () => {
  expect(SchulzeResult).toBeTruthy()
  const wrapper = mount(
    SchulzeResult,
    {
      global,
      props: {
        abstainCount: 3,
        proposals: [1, 2, 3],
        result: {
          approved: [1],
          denied: [2, 3],
          winner: 1,
          candidates: [1, 2, 3],
          pairs: [
            [[1, 2], 3],
            [[1, 3], 4],
            [[2, 1], 1],
            [[2, 3], 4],
            [[3, 1], 0],
            [[3, 2], 0]
          ],
          strong_pairs: [],
          votes: 4
        }
      }
    }
  )
  wrapper.find('button').trigger('click')
  await nextTick()
  expect(wrapper.html()).toMatchSnapshot()
  expect(wrapper.text()).toContain('#prop-1')
  expect(wrapper.text()).toContain('75 % 0 % 25 %')
  expect(wrapper.text()).toContain('100 % 0 % 0 %')
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

test('STVResult component', async () => {
  expect(STVResult).toBeTruthy()
  const wrapper = mount(
    STVResult,
    {
      global,
      props: {
        abstainCount: 3,
        proposals: [1, 2, 3],
        result: {
          approved: [1, 2],
          denied: [3],
          quota: 123,
          complete: true,
          randomized: false,
          rounds: [
            {
              status: 'Elected',
              selected: [1],
              method: 'Direct',
              vote_count: [[1, 200], [2, 100], [3, 100]]
            },
            {
              status: 'Elected',
              selected: [2],
              method: 'Direct',
              vote_count: [[2, 150], [3, 100]]
            }
          ],
          runtime: 0.0123
        }
      }
    }
  )
  wrapper.find('button').trigger('click')
  await nextTick()
  expect(wrapper.html()).toMatchSnapshot()
  expect(wrapper.text()).toContain('#prop-1')
  expect(wrapper.text()).toContain('Vote count: 200')
})
