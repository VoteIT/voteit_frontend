<template>
  <div class="richtext-editor">
    <div ref="editorElement"/>
    <div ref="completionsElement" class="ql-completions" />
  </div>
</template>

<script>
import Quill from 'quill'
import getPlaceholderModule from 'quill-placeholder-module'
import getAutocompleteModule from 'quill-placeholder-autocomplete-module'
import { onMounted, ref } from 'vue'
import useContentApi from '@/composables/useContentApi'
import useMeeting from '@/composables/meeting/useMeeting'

Quill.register('modules/placeholder', getPlaceholderModule(Quill))
Quill.register('modules/autocomplete', getAutocompleteModule(Quill))

const QUILL_CONFIG = {
  theme: 'bubble',
  modules: {
    keyboard: {
      bindings: {
        tab: null // Disable default tab behaviour
      }
    },
    placeholder: {
      delimiters: ['@', ' '] // default
    },
    autocomplete: {
      getPlaceholders: _ => [], // factory
      triggerKey: '@', // default
      // endKey: '#', // optional
      debounceTime: 0 // 0: disabled (default)
      // onOpen: _ => console.log('opened'), // optional
      // onClose: placeholder => console.log('user chose:', placeholder), // optional
      // onFetchStarted: query => console.log('user searching for:', query),     // optional
      // onFetchFinished: results => console.log('possible results:', results),  // optional
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
    }
  },
  setup (props, { emit }) {
    let editor = null
    const editorElement = ref(null)
    const completionsElement = ref(null)

    const rolesApi = useContentApi('meeting_roles')
    const { meetingId } = useMeeting()

    async function fetchPlaceholders (query) {
      if (query.length) {
        const params = {
          search: query.toLowerCase(),
          context: meetingId.value
        }
        return new Promise((resolve, reject) => {
          rolesApi.list(params)
            .then(({ data }) => {
              resolve(data.map(({ user }) => {
                return {
                  id: user.pk,
                  label: user.full_name
                }
              }))
            })
            .catch(reject)
        })
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
      config.modules.autocomplete.container = completionsElement.value
      config.modules.autocomplete.fetchPlaceholders = fetchPlaceholders
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
@import '~quill-placeholder-autocomplete-module/dist/quill-placeholder-autocomplete.css'
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
