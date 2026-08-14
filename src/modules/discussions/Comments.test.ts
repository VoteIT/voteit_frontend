import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, expect, test, vi } from 'vitest'
import { computed, ref } from 'vue'

import vuetify from '@/plugins/vuetify'
import { openDialogEvent } from '@/utils/events'
import { ApiError } from '@/utils/restApi'
import Comments from './Comments.vue'

const { mockAdd, mockSetText } = vi.hoisted(() => ({
  mockAdd: vi.fn(),
  mockSetText: vi.fn()
}))

vi.mock('./contentTypes', () => ({
  discussionPostType: { api: { add: mockAdd } }
}))

vi.mock('../agendas/useAgendaItem', () => ({
  default: () => ({
    agendaId: ref(1),
    agendaItem: ref({ pk: 1, block_discussion: false }),
    canAddDiscussionPost: computed(() => true)
  })
}))

vi.mock('../meetings/rules', () => ({ hasMeetingRole: () => true }))
vi.mock('../meetings/useMeetingId', () => ({ default: () => ref(1) }))
vi.mock('../meetings/useMeetingGroups', () => ({
  default: () => ({ canPostAs: ref(false) })
}))
vi.mock('../organisations/useUserDetails', () => ({
  default: () => ({ getUser: () => ({ userid: 'testuser' }) })
}))
vi.mock('../reactions/useReactionStore', () => ({
  default: () => ({ getMeetingButtons: () => [] })
}))

// Stands in for the Quill editor, exposing the setText() that reset() calls
vi.mock('@/components/RichtextEditor.vue', () => ({
  default: {
    props: ['modelValue', 'disabled', 'placeholder', 'submit'],
    emits: ['update:modelValue'],
    template: '<div><slot name="controls" /></div>',
    methods: { setText: mockSetText }
  }
}))

// Module-level stubs: importing the real SFCs pulls in the contentType/auth
// chain, which this test has no need to set up.
vi.mock('@/components/TagEdit.vue', () => ({
  default: { props: ['modelValue', 'setTag'], template: '<div />' }
}))
vi.mock('../meetings/PostAs.vue', () => ({
  default: { props: ['modelValue'], template: '<div />' }
}))
vi.mock('../meetings/AuthorAvatar.vue', () => ({
  default: { props: ['author', 'size'], template: '<div />' }
}))
vi.mock('../reactions/ReactionButton.vue', () => ({
  default: { template: '<div />' }
}))
vi.mock('./DiscussionPost.vue', () => ({
  default: { props: ['p'], template: '<div />' }
}))

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return { ...actual, useI18n: () => ({ t: (key: string) => key }) }
})

const stubs = {
  VExpandTransition: { template: '<div><slot /></div>' },
  VSlideXTransition: { template: '<div><slot /></div>' },
  VSpacer: true,
  VBtn: {
    template: '<button @click="$emit(\'click\')"></button>',
    emits: ['click']
  }
}

async function mountComments() {
  // @ts-ignore — vue-tsc cannot resolve mount overloads for script setup components
  const wrapper = mount(Comments, {
    props: { comments: [] },
    global: { plugins: [vuetify], stubs, mocks: { $t: (key: string) => key } }
  })
  // Type a comment long enough to skip the short-post confirmation
  await wrapper
    .findComponent({ name: 'RichtextEditor' })
    .vm.$emit('update:modelValue', 'a sufficiently long draft comment')
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.restoreAllMocks()
  mockAdd.mockReset()
  mockSetText.mockReset()
})

test('posts the comment and clears the editor on success', async () => {
  mockAdd.mockResolvedValue({ pk: 5 })
  const wrapper = await mountComments()

  await wrapper.find('button').trigger('click')
  await flushPromises()

  expect(mockAdd).toHaveBeenCalledWith(
    expect.objectContaining({
      agenda_item: 1,
      body: 'a sufficiently long draft comment'
    })
  )
  expect(mockSetText).toHaveBeenCalledWith('')
})

test('keeps the typed comment and reports the error when posting fails', async () => {
  mockAdd.mockRejectedValue(
    new ApiError(400, { body: ['Too short'] }, new Headers(), 'Bad Request')
  )
  const dialogSpy = vi.spyOn(openDialogEvent, 'emit')
  const wrapper = await mountComments()

  await wrapper.find('button').trigger('click')
  await flushPromises()

  // submit() must not swallow the error: doing so made the editor treat a
  // failed post as a success and discard what the user had typed.
  expect(mockSetText).not.toHaveBeenCalled()
  expect(dialogSpy).toHaveBeenCalledWith(
    expect.objectContaining({ title: 'Too short' })
  )
})
