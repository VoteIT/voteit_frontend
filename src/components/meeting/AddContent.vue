<template>
  <div>
    <btn :class="{ open }" @click="toggleOpen" :icon="open ? 'arrow_drop_up' : 'arrow_drop_down'">Add {{ name }}</btn>
    <form @submit.prevent="submit" v-show="open">
      <textarea @keyup.ctrl.enter="submit" v-model="title" required></textarea>
      <div class="buttons">
        <input class="btn" type="submit" value="Submit" :disabled="submitting" />
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'AddContent',
  props: {
    name: String,
    endpoint: String,
    params: Object
  },
  data () {
    return {
      title: '',
      open: false,
      submitting: false
    }
  },
  methods: {
    toggleOpen () {
      this.open = !this.open
      if (this.open) {
        this.$nextTick(_ => {
          this.$el.querySelector('textarea').focus()
        })
      }
    },
    submit () {
      if (!this.submitting) {
        const data = Object.assign({ title: this.title }, this.params)
        this.proposalSubmitting = true
        this.$api.post(this.endpoint, data)
          .then(() => {
            this.title = ''
            this.open = false
          })
          .catch(alert)
          .finally(() => {
            this.submitting = false
          })
      }
    }
  }
}
</script>

<style lang="sass" scoped>
form
  background-color: #eee
  padding: 10px
  border: 1px solid #ddd
  border-radius: 0 10px 10px 10px

  textarea
    width: 100%
    height: 6em
  .buttons
    text-align: right

button.open
  border-bottom-left-radius: 0
  border-bottom-right-radius: 0
</style>
