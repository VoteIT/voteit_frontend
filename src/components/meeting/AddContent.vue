<template>
  <btn-dropdown ref="dropdownComponent" :title="'Write ' + name" @open="editorComponent.focus()">
    <form @submit.prevent="submit">
      <richtext ref="editorComponent" v-model="text" @submit="submit()" />
      <div class="buttons">
        <input class="btn" type="submit" value="Submit" :disabled="submitting" />
      </div>
    </form>
  </btn-dropdown>
</template>

<script>
import { ref } from 'vue'

import useContentApi from '../../composables/useContentApi'
import useChannels from '../../composables/useChannels'

import BtnDropdown from '../BtnDropdown'
import Richtext from '../widgets/Richtext.vue'

const useSocket = false

export default {
  name: 'AddContent',
  components: {
    BtnDropdown,
    Richtext
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
    const text = ref('')

    function submit () {
      if (!submitting.value) {
        const body = text.value
        this.submitting = true
        if (useSocket) {
          channels.add(props.contextPk, {
            body
          })
        } else {
          const data = Object.assign({ body }, props.params)
          contentApi.add(data)
            .then(_ => {
              editorComponent.value.clear()
              dropdownComponent.value.isOpen = false
            })
            .finally(_ => {
              submitting.value = false
            })
        }
      }
    }

    const editorComponent = ref(null)
    const dropdownComponent = ref(null)

    return {
      open,
      focus,
      submitting,
      submit,
      text,
      editorComponent,
      dropdownComponent
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
