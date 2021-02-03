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

    function submit () {
      if (content.value !== props.object[props.contentAttribute]) {
        const data = {}
        data[props.contentAttribute] = content.value
        props.channel.change(props.object.pk, data)
          .then(_ => {
            emit('edit-done')
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
