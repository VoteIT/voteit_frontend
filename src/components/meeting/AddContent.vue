<template>
  <btn-dropdown ref="dropdownComponent" :title="t('content.addName', { name })" @open="editorComponent.focus()">
    <form @submit.prevent="submit">
      <richtext-editor ref="editorComponent" v-model="text" @submit="submit()" :tags="availableTags" />
      <div class="buttons">
        <btn sm icon="send" :disabled="submitDisabled">{{ t('post') }}</btn>
      </div>
    </form>
  </btn-dropdown>
</template>

<script>
import { computed, ref } from 'vue'

import useContentApi from '../../composables/useContentApi'
import useChannels from '../../composables/useChannels'

import BtnDropdown from '../BtnDropdown'
import RichtextEditor from '../widgets/RichtextEditor.vue'

export default {
  name: 'AddContent',
  inject: ['t'],
  components: {
    BtnDropdown,
    RichtextEditor
  },
  props: {
    name: String,
    // For rest
    endpoint: String,
    params: Object,
    // For channels:
    contextPk: Number,
    contentType: String,
    useRest: Boolean,
    minLength: {
      type: Number,
      default: 10
    }
  },
  setup (props) {
    // Post (data update from channels)
    const channels = useChannels(props.contentType)
    const contentApi = useContentApi(props.contentType)
    const submitting = ref(false)
    const text = ref('')

    function textContent (html) {
      const tmp = document.createElement('div')
      tmp.innerHTML = html
      return tmp.textContent || tmp.innerText || ''
    }

    const submitDisabled = computed(_ => submitting.value || textContent(text.value).length < props.minLength)

    function submit () {
      if (!submitDisabled.value) {
        const body = text.value
        this.submitting = true
        let request
        if (props.useRest) {
          const data = Object.assign({ body }, props.params)
          request = contentApi.add(data)
        } else {
          request = channels.add(props.contextPk, {
            body
          })
        }
        request
          .then(_ => {
            editorComponent.value.clear()
            dropdownComponent.value.isOpen = false
          })
          .finally(_ => {
            submitting.value = false
          })
      }
    }

    const editorComponent = ref(null)
    const dropdownComponent = ref(null)

    const availableTags = computed(_ => {
      return [`${props.contentType}-${props.contextPk}`, 'test', 'remove-this-example'] // TODO
    })

    return {
      open,
      focus,
      submitting,
      submit,
      text,
      editorComponent,
      dropdownComponent,
      availableTags,
      submitDisabled
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
</style>
