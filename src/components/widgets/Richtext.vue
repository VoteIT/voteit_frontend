<template>
  <RichtextEditor v-if="editing" v-model="content" @submit="submit()" set-focus class="richtext" />
  <div v-else v-html="object[contentAttribute]" class="richtext" />
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue'
import RichtextEditor from './RichtextEditor.vue'

export default defineComponent({
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
    object: {
      type: Object,
      required: true
    },
    editing: Boolean
  },
  emits: ['edit-done', 'updated'],
  setup (props, { emit }) {
    const content = ref(props.object[props.contentAttribute])

    async function submitRequest (pk: number, data: Object) {
      if (props.channel) {
        return props.channel.change(pk, data)
      } else if (props.api) {
        return props.api.patch(pk, data)
      }
      throw new Error('Richtext needs "api" or "channel" property to submit changes.')
    }

    function submit () {
      if (content.value !== props.object[props.contentAttribute]) {
        const data = {} as any // Huh?
        data[props.contentAttribute] = content.value
        submitRequest(props.object.pk, data)
          .then(response => {
            emit('edit-done', response)
          })
      } else {
        emit('edit-done')
      }
    }

    watch(() => props.object, value => {
      content.value = value[props.contentAttribute]
    })

    watch(() => props.editing, value => {
      if (!value) submit()
    })

    return {
      content,
      submit
    }
  },
  mounted () {
    this.$emit('updated', this.$el)
  },
  updated () {
    this.$emit('updated', this.$el)
  }
})
</script>

<style lang="sass">
.richtext
  margin: .4em 0
  p
    margin-bottom: .5em !important
    line-height: 1.3em
  ol, ul
    padding-left: 1.2em
  blockquote
    border-left: 3px solid var(--widget-alt-bg)
    padding-left: .6em
  ol, ul, p, blockquote
    margin-bottom: .2em
</style>
