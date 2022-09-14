<template>
  <div class="richtext-editor" ref="rootElement">
    <div ref="editorElement" />
    <p v-if="errors" class="text-error">
      {{ errors.join(', ') }}
    </p>
    <slot name="controls" />
    <div class="btn-controls" v-if="submit && !$slots.controls">
      <v-btn :prepend-icon="submitIcon" color="primary" :disabled="disabled" size="small" @click="$emit('submit')">
        {{ submitText || t('save') }}
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import Quill from 'quill'
import 'quill-mention'
import { defineComponent, inject, onMounted, PropType, ref } from 'vue'
import useMeeting from '@/modules/meetings/useMeeting'
import useTags, { TagsKey } from '@/modules/meetings/useTags'
import { useI18n } from 'vue-i18n'
import { QuillFormat, QuillOptions, QuillVariant, TagObject } from './types'
import { meetingRoleType } from '@/modules/meetings/contentTypes'
import { tagify } from '@/utils'

const mentionOptions = {
  allowedChars: /^[0-9A-Za-z\-_\sÅÄÖåäö]*$/,
  mentionDenotationChars: ['@', '#']
}

const variants: Record<QuillVariant, Pick<QuillOptions, 'theme' | 'formats' | 'modules'>> = {
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
          [QuillFormat.Bold, QuillFormat.Italic, QuillFormat.Link, QuillFormat.InlineCode],
          [{ script: 'sub' }, { script: 'super' }],
          [{ indent: '-1' }, { indent: '+1' }],
          [QuillFormat.BlockQuote],
          [QuillFormat.Image, QuillFormat.Video], // TODO: Embed img by url
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

export default defineComponent({
  emits: ['blur', 'focus', 'submit', 'update:modelValue'],
  props: {
    errors: Array as PropType<string[]>,
    modelValue: {
      type: String,
      default: ''
    },
    setFocus: Boolean,
    submit: Boolean,
    disabled: Boolean,
    submitText: String,
    submitIcon: {
      type: String,
      default: 'mdi-check'
    },
    placeholder: String,
    variant: {
      type: String as PropType<QuillVariant>,
      default: QuillVariant.Restricted
    }
  },
  setup (props, { emit }) {
    const { t } = useI18n()
    const tags = inject(TagsKey, ref(new Set<string>()))
    let editor: Quill | null = null
    const editorElement = ref<HTMLElement | null>(null)
    const rootElement = ref<HTMLElement | null>(null)

    const { meetingId } = useMeeting()

    function tagObject (tagName: string): TagObject {
      return { id: tagName, value: tagName }
    }

    function * filterTagObjects (filter: (tag: string) => boolean): Generator<TagObject, void> {
      for (const tag of tags.value) {
        if (filter(tag)) yield tagObject(tag)
      }
    }

    async function mentionSource (searchTerm: string, renderList: (tags: TagObject[]) => void, mentionChar: string) {
      switch (mentionChar) {
        case '#':
          renderList([
            tagObject(tagify(searchTerm)),
            ...filterTagObjects(tag => tag.startsWith(searchTerm) && tag !== searchTerm)
          ])
          break
        case '@':
          if (!searchTerm.length) return renderList([])
          // eslint-disable-next-line no-case-declarations
          const { data } = await meetingRoleType.api.list({
            search: searchTerm.toLowerCase(),
            context: meetingId.value
          })
          renderList(data.map(({ user }) => {
            return {
              id: user.pk,
              value: user.userid || user.full_name
            }
          }))
          break
      }
    }

    onMounted(() => {
      if (editorElement.value) {
        editorElement.value.innerHTML = props.modelValue // Set initial value, never change this
        const config: QuillOptions = {
          ...variants[props.variant],
          placeholder: props.placeholder
        }
        if (props.submit) {
          config.modules.keyboard.bindings.submit = {
            key: 'Enter',
            ctrlKey: true,
            handler: () => emit('submit')
          }
        }
        if (config.modules.toolbar && 'handlers' in config.modules.toolbar) {
          config.modules.toolbar.handlers.image = () => {
            if (!editor) return
            const range = editor.getSelection()
            if (!range) return
            const value = prompt('please copy paste the image url here.')
            if (value) {
                editor.insertEmbed(range.index, 'image', value, Quill.sources.USER)
            }
          }
        }
        config.modules.mention.source = mentionSource
        editor = new Quill(editorElement.value, config)
        editor.on('text-change', () => {
          emit('update:modelValue', editor?.root.innerHTML.replaceAll(/&nbsp;/g, ' ')) // Disallow non-beaking spaces - they often show up by accident
        })
        if (props.setFocus) {
          focus()
        }
        editor.root.addEventListener('focus', () => emit('focus'))
        editor.root.addEventListener('blur', () => emit('blur'))
      }
    })

    function focus () {
      if (editor) {
        editor.focus()
        editor.setSelection(editor.getLength(), editor.getLength())
        // eslint-disable-next-line no-unused-expressions
        rootElement.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }

    function clear () {
      editor && editor.setText('')
    }

    function setText (value: string) {
      editor && (editor.root.innerHTML = value)
    }

    useTags(editorElement)

    // watch(editorElement, elem => {
    //   if (!elem) return
    //   const editor = elem.querySelector('#quillEditor')?.firstChild as HTMLElement | undefined
    //   console.log(elem, editor)
    //   editor?.addEventListener('focus', () => alert('focus'))
    // }, { immediate: true })

    return {
      t,
      editorElement,
      rootElement,
      focus,
      clear,
      setText
    }
  }
})
</script>

<style lang="sass">
@import '~quill/dist/quill.core.css'
@import '~quill/dist/quill.bubble.css'
@import '~quill/dist/quill.snow.css'
@import '~quill-mention/dist/quill.mention.css'
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

// .ql-placeholder-content
//   background-color: #eef
//   padding-left: .2em
//   border-bottom: 1px solid #cce

ul.ql-mention-list
  padding: 0 !important
</style>
