<template>
  <btn-dropdown :title="'Write ' + name" @open="inputEl.focus()">
    <form @submit.prevent="submit">
      <textarea ref="inputEl" @keyup.ctrl.enter="submit" v-model="title" required></textarea>
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

const useSocket = false

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
    // Open and close
    const inputEl = ref(null)

    // Post (data update from channels)
    const channels = useChannels(props.contentType)
    const contentApi = useContentApi(props.contentType)
    const title = ref('')
    const submitting = ref(false)

    function submit () {
      if (!submitting.value) {
        this.submitting = true
        if (useSocket) {
          channels.add(props.contextPk, {
            title: title.value
          })
        } else {
          const data = Object.assign({ title: title.value }, props.params)
          contentApi.add(data)
            .then(_ => {
              title.value = ''
              open.value = false
            })
            .finally(_ => {
              submitting.value = false
            })
        }
      }
    }

    return {
      title,
      open,
      submitting,
      submit,
      inputEl
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
