<script lang="ts" setup>
import Quill from 'quill'
import 'quill-mention/autoregister'
import { inject, onMounted, ref } from 'vue'

import { getDisplayName, tagify } from '@/utils'
import useMeetingId from '@/modules/meetings/useMeetingId'
import useTags, { TagsKey } from '@/modules/meetings/useTags'
import { meetingRoleType } from '@/modules/meetings/contentTypes'

import { QuillFormat, QuillOptions, QuillVariant, TagObject } from './types'

const tags = inject(TagsKey, ref(new Set<string>()))

function toTagObject(tagName: string) {
  return { id: tagName, value: tagName }
}

function* iterTagObjects(query: string) {
  if (query.length) yield toTagObject(tagify(query))
  for (const tag of tags.value) {
    if (tag === query) continue // Exact query already yielded
    if (tag.startsWith(query)) yield toTagObject(tag)
  }
}

async function getUserObjects(query: string) {
  if (!query.length) return []
  const { data } = await meetingRoleType.api.list({
    search: query.toLowerCase(),
    meeting: meetingId.value
  })
  return data.map(({ user }) => ({
    id: user.pk,
    value: getDisplayName(user)
  }))
}

const mentionOptions = {
  allowedChars: /^[0-9A-Za-z\-_\sÅÄÖåäö]*$/,
  mentionDenotationChars: ['@', '#'],
  source(
    query: string,
    renderList: (tags: TagObject[]) => void,
    mentionChar: string
  ) {
    if (mentionChar === '#') return renderList([...iterTagObjects(query)])
    if (mentionChar === '@') return getUserObjects(query).then(renderList)
    throw new Error(`Unknown denotation character: ${mentionChar}`)
  }
}

const variants: Record<
  QuillVariant,
  Pick<QuillOptions, 'theme' | 'formats' | 'modules'>
> = {
  restricted: {
    theme: 'bubble',
    formats: [
      QuillFormat.Bold,
      QuillFormat.Italic,
      QuillFormat.Link,
      QuillFormat.BlockQuote,
      QuillFormat.List,
      QuillFormat.Mention
    ],
    modules: {
      toolbar: [
        QuillFormat.Bold,
        QuillFormat.Italic,
        QuillFormat.Link,
        QuillFormat.BlockQuote
      ],
      keyboard: {
        bindings: {
          tab: null // Disable default tab behaviour
        }
      },
      mention: mentionOptions
    }
  },
  full: {
    theme: 'snow',
    modules: {
      toolbar: {
        container: [
          [{ header: [false, 2, 3, 4] }],
          [
            QuillFormat.Bold,
            QuillFormat.Italic,
            QuillFormat.Link,
            QuillFormat.InlineCode
          ],
          [{ script: 'sub' }, { script: 'super' }],
          [{ indent: '-1' }, { indent: '+1' }],
          [QuillFormat.BlockQuote],
          [QuillFormat.Image, QuillFormat.Video],
          [{ align: [] }],
          ['clean']
        ],
        handlers: {}
      },
      keyboard: {
        bindings: {}
      },
      mention: mentionOptions
    }
  }
}

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    errors?: string[]
    modelValue?: string
    placeholder?: string
    setFocus?: boolean
    variant?: QuillVariant
  }>(),
  {
    modelValue: '',
    variant: 'restricted'
  }
)

interface Emits {
  (e: 'blur'): void
  (e: 'focus'): void
  (e: 'submit'): void
  (e: 'update:modelValue', value: string): void
}
const emit = defineEmits<Emits>()

let editor: Quill | undefined
const editorElement = ref<HTMLElement | null>(null)
const rootElement = ref<HTMLElement | null>(null)

const meetingId = useMeetingId()

onMounted(() => {
  if (!editorElement.value)
    throw new Error('Richtext editor element not available')
  editorElement.value.innerHTML = props.modelValue // Set initial value, never change this
  const config: QuillOptions = {
    ...variants[props.variant],
    placeholder: props.placeholder
  }
  config.modules.keyboard.bindings.submit = {
    key: 'Enter',
    ctrlKey: true,
    handler() {
      emit('submit')
    }
  }
  if (config.modules.toolbar && 'handlers' in config.modules.toolbar)
    config.modules.toolbar.handlers.image = () => {
      if (!editor) return
      const range = editor.getSelection()
      if (!range) return
      const value = prompt('please copy paste the image url here.')
      if (!value) return
      editor.insertEmbed(range.index, 'image', value, Quill.sources.USER)
    }
  editor = new Quill(editorElement.value, config)
  editor.on('text-change', async () => {
    if (!editor)
      return console.error(
        'Quill text-change event triggered, but editor is not available'
      )
    emit('update:modelValue', editor.root.innerHTML.replaceAll(/&nbsp;/g, ' ')) // Replace all non-beaking spaces - they often show up by accident
  })
  if (props.setFocus) focus()
  editor.root.addEventListener('focus', () => emit('focus'))
  editor.root.addEventListener('blur', () => emit('blur'))
})

function focus() {
  if (!editor) return
  editor.focus()
  editor.setSelection(editor.getLength(), editor.getLength())
  rootElement.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

function setText(value: string = '') {
  if (!editor) return
  editor.root.innerHTML = value
}

useTags(editorElement)

defineExpose({
  focus,
  setText
})
</script>

<template>
  <div class="richtext-editor" ref="rootElement">
    <div ref="editorElement"></div>
    <p v-if="errors" class="text-error">
      {{ errors.join(', ') }}
    </p>
    <slot name="controls"></slot>
  </div>
</template>

<style lang="sass">
@import quill/dist/quill.core.css
@import quill/dist/quill.bubble.css
@import quill/dist/quill.snow.css
@import quill-mention/dist/quill.mention.css

.ql-container
  background-color: rgb(var(--v-theme-surface))
  border: 1px solid rgb(var(--v-border-color))
  border-radius: 2px
  font-size: inherit
  height: auto

.ql-editor p
  margin-bottom: .5em !important
  &:last-child
    margin-bottom: 0 !important

.ql-tooltip
  z-index: 100

ul.ql-mention-list
  padding: 0 !important
</style>
