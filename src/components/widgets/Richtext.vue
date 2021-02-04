<template>
  <richtext-editor v-if="editing" v-model="content" @submit="submit()" set-focus />
  <div v-else v-html="object[contentAttribute]" />
</template>

<script>
import { ref, watch } from 'vue'
import RichtextEditor from './RichtextEditor.vue'

export default {
  name: 'Richtext',
  components: {
    RichtextEditor
  },
  props: {
    channel: Object,
    api: Object,
    contentAttribute: {
      type: String,
      default: 'body'
    },
    object: Object,
    editing: Boolean
  },
  emits: ['edit-done'],
  setup (props, { emit }) {
    const content = ref(props.object[props.contentAttribute])

    async function submitRequest (pk, data) {
      if (props.channel) {
        return props.channel.change(pk, data)
      } else if (props.api) {
        return props.api.patch(pk, data)
      }
      throw new Error('Richtext needs "api" or "channel" property to submit changes.')
    }

    function submit () {
      if (content.value !== props.object[props.contentAttribute]) {
        const data = {}
        data[props.contentAttribute] = content.value
        submitRequest(props.object.pk, data)
          .then(response => {
            emit('edit-done', response)
          })
      } else {
        emit('edit-done')
      }
    }

    watch(_ => props.editing, value => {
      if (!value) submit()
    })

    return {
      content,
      submit
    }
  }
}
</script>
