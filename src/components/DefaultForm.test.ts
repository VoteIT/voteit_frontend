import { flushPromises, mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { h } from 'vue'

import vuetify from '@/plugins/vuetify'
import { ApiError, NetworkError } from '@/utils/restApi'
import DefaultForm from './DefaultForm.vue'

function mountForm(handler: () => Promise<unknown>) {
  return mount(DefaultForm, {
    props: { handler, modelValue: { title: '' } },
    slots: {
      default: ({ errors }: { errors: { title?: string[] } }) =>
        h('p', { class: 'title-errors' }, errors.title?.join(', '))
    },
    global: { plugins: [vuetify], mocks: { $t: (key: string) => key } }
  })
}

test('Field errors go to the slot, non-field errors are shown by the form', async () => {
  const wrapper = mountForm(
    vi
      .fn()
      .mockRejectedValue(
        new ApiError(
          400,
          { title: ['Too long'], non_field_errors: ['Not allowed'] },
          new Headers(),
          'Bad Request'
        )
      )
  )
  await wrapper.find('form').trigger('submit')
  await flushPromises()

  expect(wrapper.find('.title-errors').text()).toBe('Too long')
  expect(wrapper.find('.v-alert').text()).toContain('Not allowed')
  expect(wrapper.emitted('error')).toHaveLength(1)
  expect(wrapper.emitted('done')).toBeUndefined()
})

test('A request that never reached the server is reported', async () => {
  const wrapper = mountForm(vi.fn().mockRejectedValue(new NetworkError()))
  await wrapper.find('form').trigger('submit')
  await flushPromises()

  expect(wrapper.find('.v-alert').text()).toContain('No response from server')
})

test('A successful submit shows no errors', async () => {
  const wrapper = mountForm(vi.fn().mockResolvedValue(undefined))
  await wrapper.find('form').trigger('submit')
  await flushPromises()

  expect(wrapper.find('.v-alert').exists()).toBe(false)
  expect(wrapper.emitted('done')).toHaveLength(1)
})
