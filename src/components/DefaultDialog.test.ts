import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'

import DefaultDialog from './DefaultDialog.vue'

// Stand-in for Vuetify's dialog: shows its content while open, and lets the test close it the way Esc or a
// click outside does.
const VDialog = defineComponent({
  props: { modelValue: Boolean },
  emits: ['update:modelValue'],
  setup(props, { emit, slots }) {
    return () =>
      h('div', [
        slots.activator?.({
          props: { onClick: () => emit('update:modelValue', true) }
        }),
        props.modelValue
          ? h('section', [
              h('button', {
                class: 'dismiss',
                onClick: () => emit('update:modelValue', false)
              }),
              slots.default?.({})
            ])
          : null
      ])
  }
})

const VSheet = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      h('div', slots.default?.())
})

function mountDialog(props: Record<string, unknown> = {}) {
  return mount(DefaultDialog, {
    props,
    slots: {
      activator: ({ props }: { props: Record<string, unknown> }) =>
        h('button', { class: 'activator', ...props }),
      default: () => h('p', 'Content')
    },
    global: { stubs: { VDialog, VSheet, VBtn: true, VSpacer: true } }
  })
}

test('follows modelValue when the parent keeps it open after a close', async () => {
  // Like Modal with another modal queued: it handles the close, but stays open
  const wrapper = mountDialog({ modelValue: true })
  await wrapper.find('.dismiss').trigger('click')
  expect(wrapper.emitted('close')).toHaveLength(1)
  await nextTick()
  await nextTick()
  expect(wrapper.find('p').exists()).toBe(true)
})

test('closes when the parent lets it', async () => {
  const wrapper = mountDialog({
    modelValue: true,
    'onUpdate:modelValue': (value: boolean) =>
      wrapper.setProps({ modelValue: value })
  })
  await wrapper.find('.dismiss').trigger('click')
  await nextTick()
  await nextTick()
  expect(wrapper.find('p').exists()).toBe(false)
})

test('opened by its activator, it stays open and closes on dismiss', async () => {
  const wrapper = mountDialog()
  await wrapper.find('.activator').trigger('click')
  await nextTick()
  expect(wrapper.find('p').exists()).toBe(true)
  await wrapper.find('.dismiss').trigger('click')
  await nextTick()
  await nextTick()
  expect(wrapper.find('p').exists()).toBe(false)
})
