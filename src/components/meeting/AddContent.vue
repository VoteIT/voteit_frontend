<template>
  <btn-dropdown ref="dropdownElement" :title="'Write ' + name" @open="focus()">
    <form @submit.prevent="submit">
      <div ref="editorElement" />
      <div class="buttons">
        <input class="btn" type="submit" value="Submit" :disabled="submitting" />
      </div>
    </form>
  </btn-dropdown>
</template>

<script>
import Quill from 'quill'
import { onMounted, ref } from 'vue'

import { MDConverter } from '@/utils'

import useContentApi from '../../composables/useContentApi'
import useChannels from '../../composables/useChannels'

import BtnDropdown from '../BtnDropdown'

const useSocket = false

const QUILL_CONFIG = {
  theme: 'snow',
  modules: {
    toolbar: null,
    keyboard: {
      bindings: {
        tab: null // Disable default tab behaviour
      }
    }
  }
}

export default {
  name: 'AddContent',
  components: {
    BtnDropdown
  },
  props: {
    name: String,
    // For rest
    endpoint: String,
    params: Object,
    // For channels:
    contextPk: Number,
    contentType: String
  },
  setup (props) {
    // Post (data update from channels)
    const channels = useChannels(props.contentType)
    const contentApi = useContentApi(props.contentType)
    const submitting = ref(false)

    function submit () {
      if (!submitting.value) {
        const title = editor.getText().split('\n')[0] // TODO: NO!
        const html = editor.container.firstChild.innerHTML
        const body = MDConverter.makeMarkdown(html)
        this.submitting = true
        if (useSocket) {
          channels.add(props.contextPk, {
            body
          })
        } else {
          const data = Object.assign({ title, body }, props.params)
          contentApi.add(data)
            .then(_ => {
              editor.setContents('')
              dropdownElement.value.isOpen = false
            })
            .finally(_ => {
              submitting.value = false
            })
        }
      }
    }

    let editor = null
    const editorElement = ref(null)
    onMounted(_ => {
      const config = Object.assign({}, QUILL_CONFIG)
      config.modules.keyboard.bindings.submit = {
        key: 'Enter',
        ctrlKey: true,
        handler: submit
      }
      editor = new Quill(editorElement.value, config)
    })

    function focus () {
      editor.focus()
    }

    const dropdownElement = ref(null)

    return {
      open,
      focus,
      submitting,
      submit,
      editorElement,
      dropdownElement
    }
  }
}
</script>

<style lang="sass" scoped>
textarea
  width: 100%
  height: 8em
  border: 1px solid #ccc
  &:focus
    outline: solid #ccc 1px
.buttons
  text-align: right

.ql-container
  background-color: #fff
</style>
