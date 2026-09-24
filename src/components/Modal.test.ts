import { mount } from '@vue/test-utils'
import { afterEach, expect, test, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'

import { openModal } from '@/utils/modal'
import { closeModalEvent } from '@/utils/events'
import Modal from './Modal.vue'

// Leave Vuetify's dialog out of it: show the title and content only while open.
vi.mock('./DefaultDialog.vue', () => ({
  default: defineComponent({
    props: { modelValue: Boolean, title: String },
    emits: ['close'],
    setup(props, { slots }) {
      return () =>
        props.modelValue
          ? h('div', [h('h2', props.title), slots.default?.()])
          : null
    }
  })
}))

const Content = defineComponent({
  props: { text: { type: String, required: true } },
  setup: (props) => () => h('p', props.text)
})

let wrapper: ReturnType<typeof mount> | undefined
// The queue goes with the component
afterEach(() => wrapper?.unmount())

async function mountModal() {
  wrapper = mount(Modal)
  await nextTick()
  return wrapper
}

test('renders the component with its props', async () => {
  const wrapper = await mountModal()
  openModal({ component: Content, props: { text: 'Hello' }, title: 'Greeting' })
  await nextTick()
  expect(wrapper.find('h2').text()).toBe('Greeting')
  expect(wrapper.find('p').text()).toBe('Hello')
})

test('the returned close closes that modal, not the one showing', async () => {
  const wrapper = await mountModal()
  const onClose = vi.fn()
  openModal({ component: Content, props: { text: 'First' } })
  const closeSecond = openModal({
    component: Content,
    props: { text: 'Second' },
    onClose
  })
  await nextTick()
  closeSecond()
  await nextTick()
  expect(onClose).toHaveBeenCalledOnce()
  expect(wrapper.find('p').text()).toBe('First')
  // Closing it again doesn't close anything else
  closeSecond()
  await nextTick()
  expect(onClose).toHaveBeenCalledOnce()
  expect(wrapper.find('p').text()).toBe('First')
})

test('closing without a modal closes the one showing', async () => {
  const wrapper = await mountModal()
  openModal({ component: Content, props: { text: 'First' } })
  openModal({ component: Content, props: { text: 'Second' } })
  await nextTick()
  closeModalEvent.emit()
  await nextTick()
  expect(wrapper.find('p').text()).toBe('Second')
})

test('title may be a getter, and follows it', async () => {
  const wrapper = await mountModal()
  const title = ref('Before')
  openModal({ html: '<b>x</b>', title: () => title.value })
  await nextTick()
  expect(wrapper.find('h2').text()).toBe('Before')
  title.value = 'After'
  await nextTick()
  expect(wrapper.find('h2').text()).toBe('After')
})
