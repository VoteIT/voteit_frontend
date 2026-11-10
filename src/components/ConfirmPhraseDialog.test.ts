import { flushPromises, mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import vuetify from '@/plugins/vuetify'
import { ApiError } from '@/utils/restApi'

import ConfirmPhraseDialog from './ConfirmPhraseDialog.vue'

// Stand-in for DefaultDialog: open from the start, content shown inline
const DefaultDialog = defineComponent({
  props: { modelValue: Boolean },
  emits: ['update:modelValue', 'open'],
  setup(props, { emit, slots }) {
    emit('update:modelValue', true)
    emit('open')
    const close = () => emit('update:modelValue', false)
    return () =>
      h(
        'section',
        { class: props.modelValue ? 'open' : 'closed' },
        slots.default?.({ close })
      )
  }
})

// Stand-in for vue-i18n's <i18n-t>: renders only the slots
const I18nT = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      h('span', slots.phrase?.())
})

function mountDialog(confirm: () => Promise<unknown>) {
  return mount(ConfirmPhraseDialog, {
    props: { confirm, phrase: 'jane' },
    global: {
      plugins: [vuetify],
      mocks: { $t: (key: string) => key },
      stubs: { DefaultDialog, I18nT }
    }
  })
}

function confirmButton(wrapper: ReturnType<typeof mountDialog>) {
  return wrapper.find('button[type="submit"]')
}

test('tells the user what to type', () => {
  const wrapper = mountDialog(vi.fn())
  expect(wrapper.find('.v-alert strong').text()).toBe('jane')
})

test('confirm stays disabled until the phrase is typed', async () => {
  const confirm = vi.fn().mockResolvedValue(undefined)
  const wrapper = mountDialog(confirm)
  expect(confirmButton(wrapper).attributes('disabled')).toBeDefined()

  await wrapper.find('input').setValue('jan')
  expect(confirmButton(wrapper).attributes('disabled')).toBeDefined()
  await wrapper.find('form').trigger('submit')
  expect(confirm).not.toHaveBeenCalled()

  await wrapper.find('input').setValue(' jane ')
  expect(confirmButton(wrapper).attributes('disabled')).toBeUndefined()
})

test('closes once confirm resolves', async () => {
  const confirm = vi.fn().mockResolvedValue(undefined)
  const wrapper = mountDialog(confirm)
  await wrapper.find('input').setValue('jane')
  await wrapper.find('form').trigger('submit')
  await flushPromises()
  expect(confirm).toHaveBeenCalledOnce()
  expect(wrapper.find('section').classes()).toContain('closed')
})

test('stays open and shows the error when confirm rejects', async () => {
  const confirm = vi
    .fn()
    .mockRejectedValue(
      new ApiError(
        400,
        { non_field_errors: ['Not now'] },
        new Headers(),
        'Bad Request'
      )
    )
  const wrapper = mountDialog(confirm)
  await wrapper.find('input').setValue('jane')
  await wrapper.find('form').trigger('submit')
  await flushPromises()
  expect(wrapper.find('section').classes()).toContain('open')
  expect(wrapper.find('.v-alert.text-error, .v-alert.bg-error').text()).toContain('Not now')
})
