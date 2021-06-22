<template>
  <RichtextEditor v-if="editing" submit v-model="content" @submit="submit()" set-focus class="richtext" />
  <div v-else ref="el" v-html="content" class="richtext" />
</template>

<script lang="ts">
import useTags from '@/composables/meeting/useTags'
import { defineComponent, ref, watch } from 'vue'
import RichtextEditor from './RichtextEditor.vue'

export default defineComponent({
  name: 'Richtext',
  components: {
    RichtextEditor
  },
  props: {
    modelValue: String,
    channel: Object,
    api: Object,
    contentAttribute: {
      type: String,
      default: 'body'
    },
    object: Object,
    editing: Boolean
  },
  emits: ['edit-done', 'updated', 'update:modelValue'],
  setup (props, { emit }) {
    function getContent (): string {
      if (props.object) return props.object[props.contentAttribute]
      if (props.modelValue) return props.modelValue
      throw new Error('RichText needs :object=<object> or v-model=<string>')
    }
    const content = ref(getContent())

    async function submitRequest (pk: number, data: Object) {
      if (props.channel) await props.channel.change(pk, data)
      if (props.api) await props.api.patch(pk, data)
    }

    async function submit () {
      if (props.modelValue) emit('edit-done')
      if (props.object && content.value !== getContent()) {
        const data: Record<string, string> = {}
        data[props.contentAttribute] = content.value
        const response = await submitRequest(props.object.pk, data)
        emit('edit-done', response)
      } else {
        emit('edit-done')
      }
    }

    watch(props, () => {
      if (props.editing) return
      content.value = getContent()
    })
    watch(() => props.editing, value => {
      if (!value) submit()
    })
    watch(content, value => {
      emit('update:modelValue', value)
    })

    const el = ref<HTMLElement | null>(null)
    useTags(el)

    return {
      content,
      submit,
      el
    }
  }
  // mounted () {
  //   this.$emit('updated', this.$el)
  // },
  // updated () {
  //   this.$emit('updated', this.$el)
  // }
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
