<script lang="ts" setup>
import { ifilter, imap } from 'itertools'
import Quill from 'quill'
import 'quill-mention/autoregister'
import { inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { getDisplayName, tagify } from '@/utils'
import useMeetingId from '@/modules/meetings/useMeetingId'
import useTags, { TagsKey } from '@/modules/meetings/useTags'
import { meetingRoleType } from '@/modules/meetings/contentTypes'

import { QuillFormat, QuillOptions, QuillVariant, TagObject } from './types'

const mentionOptions = {
  allowedChars: /^[0-9A-Za-z\-_\sÅÄÖåäö]*$/,
  mentionDenotationChars: ['@', '#']
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
    submit?: boolean
    submitIcon?: string
    submitText?: string
    variant?: QuillVariant
  }>(),
  {
    modelValue: '',
    submitIcon: 'mdi-check',
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

const { t } = useI18n()
const tags = inject(TagsKey, ref(new Set<string>()))
let editor: Quill | undefined
const editorElement = ref<HTMLElement | null>(null)
const rootElement = ref<HTMLElement | null>(null)

const meetingId = useMeetingId()

function toTagObject(tagName: string) {
  return { id: tagName, value: tagName }
}

function getTagObjects(query: string) {
  return [
    toTagObject(tagify(query)), // Exact query, tagified
    ...imap(
      ifilter(
        tags.value,
        (tag: string) => tag.startsWith(query) && tag !== query // Exact query already in array
      ),
      toTagObject
    )
  ]
}

async function mentionSource(
  searchTerm: string,
  renderList: (tags: TagObject[]) => void,
  mentionChar: string
) {
  switch (mentionChar) {
    case '#':
      renderList(getTagObjects(searchTerm))
      break
    case '@': {
      if (!searchTerm.length) return renderList([])
      const { data } = await meetingRoleType.api.list({
        search: searchTerm.toLowerCase(),
        meeting: meetingId.value
      })
      renderList(
        data.map(({ user }) => ({
          id: user.pk,
          value: getDisplayName(user)
        }))
      )
      break
    }
  }
}

onMounted(() => {
  if (!editorElement.value)
    throw new Error('Richtext editor element not available')
  editorElement.value.innerHTML = props.modelValue // Set initial value, never change this
  const config: QuillOptions = {
    ...variants[props.variant],
    placeholder: props.placeholder
  }
  if (props.submit)
    config.modules.keyboard.bindings.submit = {
      key: 'Enter',
      ctrlKey: true,
      handler: () => emit('submit')
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
  config.modules.mention.source = mentionSource
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
    <div class="btn-controls" v-if="submit && !$slots.controls">
      <v-btn
        :prepend-icon="submitIcon"
        color="primary"
        :disabled="disabled"
        size="small"
        @click="$emit('submit')"
      >
        {{ submitText || t('save') }}
      </v-btn>
    </div>
  </div>
</template>

<style lang="sass">
@import quill/dist/quill.core.css
@import quill/dist/quill.bubble.css
@import quill/dist/quill.snow.css
@import quill-mention/dist/quill.mention.css

.richtext-editor
  .btn-controls
    justify-content: flex-end
    margin-top: -3px
    margin-right: 6px

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
