<template>
  <div class="richtext-editor">
    <div ref="editorElement"/>
  </div>
</template>

<script>
import Quill from 'quill'
import 'quill-mention'
import { onMounted, ref } from 'vue'
import useContentApi from '@/composables/useContentApi'
import useMeeting from '@/composables/meeting/useMeeting'

const QUILL_CONFIG = {
  theme: 'bubble',
  // formats: ['bold', 'italic', 'link', 'code', 'blockquote', 'list'],
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

export default {
  name: 'Richtext',
  emits: ['submit', 'update:modelValue'],
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    tags: {
      type: Array,
      required: false
    }
  },
  setup (props, { emit }) {
    let editor = null
    const editorElement = ref(null)
    const completionsElement = ref(null)

    const rolesApi = useContentApi('meeting_roles')
    const { meetingId } = useMeeting()

    function tagObject (tagName) {
      return { id: tagName, value: tagName }
    }

    async function mentionSource (searchTerm, renderList, mentionChar) {
      switch (mentionChar) {
        case '#':
          renderList(
            [tagObject(searchTerm)].concat(
              props.tags
                .filter(t => t !== searchTerm && t.startsWith(searchTerm))
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
            .then(({ data }) => {
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

    onMounted(_ => {
      editorElement.value.innerHTML = props.modelValue // Set initial value, never change this
      const config = Object.assign({}, QUILL_CONFIG)
      config.modules.keyboard.bindings.submit = {
        key: 'Enter',
        ctrlKey: true,
        handler: _ => emit('submit')
      }
      config.modules.mention.source = mentionSource
      editor = new Quill(editorElement.value, config)
      editor.on('text-change', _ => {
        emit('update:modelValue', editor.root.innerHTML)
      })
    })

    function focus () {
      editor.focus()
    }

    function clear () {
      editor.setContents('')
    }

    return {
      editorElement,
      completionsElement,
      focus,
      clear
    }
  }
}
</script>

<style lang="sass">
@import '~quill/dist/quill.core.css'
@import '~quill/dist/quill.bubble.css'
@import '~quill-mention/dist/quill.mention.css'
.richtext-editor
  position: relative

.ql-container
  background-color: #fff
  border-radius: 2px

.ql-placeholder-content
  background-color: #eef
  padding-left: .2em
  border-bottom: 1px solid #cce
</style>
