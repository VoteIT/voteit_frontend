<template>
  <div>
    <btn :class="{ open }" @click="toggleOpen" :icon="open ? 'arrow_drop_up' : 'arrow_drop_down'">Write {{ name }}</btn>
    <form @submit.prevent="submit" v-show="open">
      <textarea ref="inputEl" @keyup.ctrl.enter="submit" v-model="title" required></textarea>
      <div class="buttons">
        <input class="btn" type="submit" value="Submit" :disabled="submitting" />
      </div>
    </form>
  </div>
</template>

<script>
import { nextTick, ref } from 'vue'
import useRestApi from '../../composables/useRestApi'
// import useChannels from '../../composables/useChannels'

export default {
  name: 'AddContent',
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
    const open = ref(false)
    const inputEl = ref(null)
    function toggleOpen () {
      open.value = !open.value
      if (open.value) {
        nextTick(_ => {
          inputEl.value.focus()
        })
      }
    }

    // Post (data change picket up from channels)
    // const channels = useChannels(props.contentType)
    const { restApi } = useRestApi()
    const title = ref('')
    const submitting = ref(false)

    function submit () {
      if (!submitting.value) {
        this.submitting = true
        // channels.add(props.contextPk, {
        //   title: title.value
        // })
        const data = Object.assign({ title: this.title }, this.params)
        restApi.post(this.endpoint, data)
          .then(_ => {
            title.value = ''
            open.value = false
          })
          .finally(_ => {
            submitting.value = false
          })
      }
    }

    return {
      title,
      open,
      submitting,
      toggleOpen,
      submit,
      inputEl,
      ...props
    }
  }
}
</script>

<style lang="sass" scoped>
form
  background-color: #eee
  padding: 10px
  border-bottom: 1px solid #ddd
  border-right: 1px solid #ddd
  border-radius: 0 10px 10px 10px

  textarea
    width: 100%
    height: 8em
    border: 1px solid #ccc
    &:focus
      outline: solid #ccc 1px
  .buttons
    text-align: right

button
  padding-right: 1rem
  &.open
    border-bottom-left-radius: 0
    border-bottom-right-radius: 0
    background-color: #eee
</style>
