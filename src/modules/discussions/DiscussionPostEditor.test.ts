import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, expect, test, vi } from 'vitest'
import { ref } from 'vue'

import vuetify from '@/plugins/vuetify'
import { openDialogEvent } from '@/utils/events'
import { ApiError } from '@/utils/restApi'
import DiscussionPostEditor from './DiscussionPostEditor.vue'

const { mockSetText } = vi.hoisted(() => ({ mockSetText: vi.fn() }))

vi.mock('../meetings/useMeetingId', () => ({ default: () => ref(1) }))

vi.mock('../meetings/useMeetingGroups', () => ({
  default: () => ({ canPostAs: ref(false) })
}))

// Stands in for the Quill editor, exposing the setText() that reset() calls
vi.mock('@/components/RichtextEditor.vue', () => ({
  default: {
    props: ['modelValue', 'disabled', 'placeholder', 'submit'],
    template: '<div><slot name="controls" /></div>',
    methods: { setText: mockSetText }
  }
}))

// Stubbed at the module level: importing the real SFCs pulls in the
// contentType/auth chain, which this test has no need to set up.
vi.mock('@/components/TagEdit.vue', () => ({
  default: { props: ['modelValue', 'setTag'], template: '<div />' }
}))

vi.mock('../meetings/PostAs.vue', () => ({
  default: { props: ['modelValue'], template: '<div />' }
}))

vi.mock('../meetings/AuthorAvatar.vue', () => ({
  default: { props: ['author', 'size'], template: '<div />' }
}))

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return { ...actual, useI18n: () => ({ t: (key: string) => key }) }
})

const stubs = {
  VExpandTransition: { template: '<div><slot /></div>' },
  VSpacer: true,
  VBtn: {
    template: '<button @click="$emit(\'click\')"></button>',
    emits: ['click']
  }
}

function mountEditor(handler: (post: unknown) => Promise<void>) {
  // @ts-ignore — vue-tsc cannot resolve mount overloads for script setup components
  return mount(DiscussionPostEditor, {
    props: { handler, modelValue: 'a draft comment', warnLength: 0 },
    global: { plugins: [vuetify], stubs, mocks: { $t: (key: string) => key } }
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
  mockSetText.mockReset()
})

test('resets the editor when the post succeeds', async () => {
  const handler = vi.fn().mockResolvedValue(undefined)
  const wrapper = mountEditor(handler)

  await wrapper.find('button').trigger('click')
  await flushPromises()

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({ body: 'a draft comment' })
  )
  // reset() clears the editor
  expect(mockSetText).toHaveBeenCalledWith('')
})

test('keeps the text and reports the error when the post fails', async () => {
  const handler = vi
    .fn()
    .mockRejectedValue(
      new ApiError(400, { body: ['Too short'] }, new Headers(), 'Bad Request')
    )
  const dialogSpy = vi.spyOn(openDialogEvent, 'emit')
  const wrapper = mountEditor(handler)

  await wrapper.find('button').trigger('click')
  await flushPromises()

  // The user's text must survive a failed post — reset() must not run
  expect(mockSetText).not.toHaveBeenCalled()
  expect(dialogSpy).toHaveBeenCalledWith(
    expect.objectContaining({ title: 'Too short' })
  )
})
