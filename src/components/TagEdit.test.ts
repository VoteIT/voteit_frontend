import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { nextTick, ref } from 'vue'

import vuetify from '@/plugins/vuetify'
import { TagsKey } from '@/modules/meetings/useTags'
import TagEdit from './TagEdit.vue'

function mountTagEdit(modelValue: string[] = []) {
  return mount(TagEdit, {
    props: { modelValue },
    global: {
      plugins: [vuetify],
      mocks: { $t: (key: string) => key },
      provide: { [TagsKey as symbol]: ref(new Set<string>()) }
    }
  })
}

/** Type like a user would: an InputEvent, not a datalist pick */
async function type(wrapper: ReturnType<typeof mountTagEdit>, text: string) {
  const input = wrapper.find<HTMLInputElement>('input.tag-input')
  input.element.value = text
  input.element.dispatchEvent(
    new InputEvent('input', { inputType: 'insertText' })
  )
  await nextTick()
}

function lastEmitted(wrapper: ReturnType<typeof mountTagEdit>) {
  return wrapper.emitted('update:modelValue')?.at(-1)?.[0]
}

test('A hint says to press Enter while a tag is typed', async () => {
  const wrapper = mountTagEdit()
  expect(wrapper.text()).not.toContain('addTagHint')

  await type(wrapper, 'budget')
  expect(wrapper.text()).toContain('addTagHint')

  await type(wrapper, '')
  expect(wrapper.text()).not.toContain('addTagHint')
})

test('Leaving the field adds the typed tag', async () => {
  const wrapper = mountTagEdit(['existing'])
  const input = wrapper.find<HTMLInputElement>('input.tag-input')
  await type(wrapper, 'New Tag')
  await input.trigger('blur')

  expect(lastEmitted(wrapper)).toEqual(['existing', 'new-tag'])
  expect(input.element.value).toBe('')
  expect(wrapper.text()).not.toContain('addTagHint')
})

test('Leaving an empty field adds nothing', async () => {
  const wrapper = mountTagEdit()
  await wrapper.find('input.tag-input').trigger('blur')
  expect(wrapper.emitted('update:modelValue')).toBeUndefined()
})

test('Enter adds the typed tag', async () => {
  const wrapper = mountTagEdit()
  const input = wrapper.find('input.tag-input')
  await type(wrapper, 'budget')
  await input.trigger('keydown', { key: 'Enter' })

  expect(lastEmitted(wrapper)).toEqual(['budget'])
})
