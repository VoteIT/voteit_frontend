<template>
  <div class="richtext-editor" ref="rootElement">
    <div ref="editorElement"/>
    <div class="btn-controls" v-if="submit">
      <v-btn :prepend-icon="submitIcon" color="primary" :disabled="disabled" size="small" @click="$emit('submit')">
        {{ submitText || t('save') }}
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import Quill from 'quill'
import 'quill-mention'
import { defineComponent, onMounted, PropType, ref } from 'vue'
import meetingRoleType from '@/contentTypes/meetingRole'
import useMeeting from '@/composables/meeting/useMeeting'
import { MeetingRoles } from '@/composables/types'
import useTags from '@/composables/meeting/useTags'

interface TagObject {
  id: string | number
  value: string
}

const QUILL_CONFIG: any = {
  theme: 'bubble',
  formats: ['bold', 'italic', 'link', 'code', 'blockquote', 'list', 'mention'],
  modules: {
    toolbar: ['bold', 'italic', 'link', 'code', 'blockquote'],
    keyboard: {
      bindings: {
        tab: null // Disable default tab behaviour
      }
    },
    mention: {
      allowedChars: /^[0-9A-Za-z\-\sÅÄÖåäö]*$/,
      mentionDenotationChars: ['@', '#']
    }
  }
}

export default defineComponent({
  inject: ['t'],
  emits: ['submit', 'update:modelValue'],
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    tags: {
      type: Set as PropType<Set<string>>,
      default: () => new Set()
    },
    setFocus: Boolean,
    submit: Boolean,
    disabled: Boolean,
    submitText: String,
    submitIcon: {
      type: String,
      default: 'mdi-check'
    },
    placeholder: String
  },
  setup (props, { emit }) {
    let editor: Quill | null = null
    const editorElement = ref<HTMLElement | null>(null)
    const rootElement = ref<HTMLElement | null>(null)

    const rolesApi = meetingRoleType.getContentApi()
    const { meetingId } = useMeeting()

    function tagObject (tagName: string): TagObject {
      return { id: tagName, value: tagName }
    }

    function * filterTagObjects (filter: (tag: string) => boolean): Generator<TagObject, void> {
      for (const tag of props.tags) {
        if (filter(tag)) yield tagObject(tag)
      }
    }

    async function mentionSource (searchTerm: string, renderList: (tags: TagObject[]) => void, mentionChar: string) {
      switch (mentionChar) {
        case '#':
          renderList([
            tagObject(searchTerm),
            ...filterTagObjects(tag => tag.startsWith(searchTerm))
          ])
          break
        case '@':
          if (!searchTerm.length) {
            return renderList([])
          }
          rolesApi.list({
            search: searchTerm.toLowerCase(),
            context: meetingId.value
          })
            .then(({ data }: { data: MeetingRoles[] }) => {
              renderList(data.map(({ user }) => {
                return {
                  id: user.pk,
                  value: user.full_name
                }
              }))
            })
          break
      }
    }

    onMounted(() => {
      if (editorElement.value) {
        editorElement.value.innerHTML = props.modelValue // Set initial value, never change this
        const config = {
          ...QUILL_CONFIG,
          placeholder: props.placeholder
        }
        if (props.submit) {
          config.modules.keyboard.bindings.submit = {
            key: 'Enter',
            ctrlKey: true,
            handler: () => emit('submit')
          }
        }
        config.modules.mention.source = mentionSource
        editor = new Quill(editorElement.value, config)
        editor.on('text-change', () => {
          emit('update:modelValue', editor?.root.innerHTML)
        })
        if (props.setFocus) {
          focus()
        }
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

    return {
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

.mention
  background-color: rgba(var(--v-theme-primary), .3)
  padding: .3em .1em .1em
</style>
