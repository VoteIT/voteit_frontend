<template>
  <div>
    <button @click="open = !open">{{ open ? '-' : '+' }} Add {{ name }}</button>
    <form @submit.prevent="submit" v-show="open">
      <textarea v-model="title" required></textarea>
      <div class="buttons">
        <input type="submit" value="Submit" :disabled="submitting" />
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
  .buttons
    text-align: right
</style>
