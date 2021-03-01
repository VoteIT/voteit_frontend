<template>
  <div class="richtext-editor">
    <div ref="editorElement"/>
  </div>
</template>

<script lang="ts">
import Quill from 'quill'
import 'quill-mention'
import { defineComponent, onMounted, PropType, ref } from 'vue'
import meetingRoleType from '@/contentTypes/meetingRole'
import useMeeting from '@/composables/meeting/useMeeting'
import { MeetingRoles } from '@/composables/types'

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
  name: 'RichtextEditor',
  emits: ['submit', 'update:modelValue'],
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    tags: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    setFocus: Boolean
  },
  setup (props, { emit }) {
    let editor: Quill | null = null
    const editorElement = ref<HTMLElement | null>(null)
    const completionsElement = ref(null)

    const rolesApi = meetingRoleType.useContentApi()
    const { meetingId } = useMeeting()

    function tagObject (tagName: string) {
      return { id: tagName, value: tagName }
    }

    async function mentionSource (searchTerm: string, renderList: CallableFunction, mentionChar: string) {
      switch (mentionChar) {
        case '#':
          renderList(
            [tagObject(searchTerm)].concat(
              (props.tags || [])
                .filter(tag => tag !== searchTerm && tag.startsWith(searchTerm))
                .map(tagObject))
          )
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
        const config = Object.assign({}, QUILL_CONFIG)
        config.modules.keyboard.bindings.submit = {
          key: 'Enter',
          ctrlKey: true,
          handler: () => emit('submit')
        }
        config.modules.mention.source = mentionSource
        editor = new Quill(editorElement.value, config)
        editor.on('text-change', () => {
          emit('update:modelValue', editor && editor.root.innerHTML)
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
      }
    }

    function clear () {
      editor && editor.setText('')
    }

    return {
      editorElement,
      completionsElement,
      focus,
      clear
    }
  }
})
</script>

<style lang="sass">
@import '~quill/dist/quill.core.css'
@import '~quill/dist/quill.bubble.css'
@import '~quill-mention/dist/quill.mention.css'
.richtext-editor
  position: relative

.ql-container
  background-color: var(--bg)
  border-radius: 2px

// .ql-placeholder-content
//   background-color: #eef
//   padding-left: .2em
//   border-bottom: 1px solid #cce

.mention
  background-color: var(--mention)
  padding: .3em .1em .1em
</style>
