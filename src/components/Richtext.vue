<template>
  <RichtextEditor :variant="variant" v-if="editing" submit v-model="content" @submit="submit()" set-focus class="richtext" />
  <div v-else ref="el" v-html="content" class="richtext" />
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from 'vue'

import useTags from '@/modules/meetings/useTags'
import RichtextEditor from './RichtextEditor.vue'
import { QuillVariant } from './types'

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
    editing: Boolean,
    variant: {
      type: String as PropType<QuillVariant>,
      default: QuillVariant.Restricted
    }
  },
  emits: ['edit-done', 'updated', 'update:modelValue'],
  setup (props, { emit }) {
    function getContent (): string {
      if (props.object) return props.object[props.contentAttribute]
      if (typeof props.modelValue === 'string') return props.modelValue
      throw new Error('RichText needs :object=<object> or v-model=<string>')
    }
    const content = ref(getContent())

    async function submitRequest (pk: number, data: Object) {
      if (props.channel) await props.channel.change(pk, data)
      if (props.api) await props.api.patch(pk, data)
    }

    async function submit () {
      if (props.modelValue) return emit('edit-done')
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
    // watch(() => props.editing, value => {
    //   if (!value) submit()
    // })
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
})
</script>

<style lang="sass">
.richtext
  margin: .4em 0
  ol, ul
    padding-left: 1.2em
  blockquote
    border-left: 3px solid rgb(var(--v-border-color))
    padding: .2em 0 .2em .6em
    font-style: italic
  ol, ul, blockquote, p
    margin-bottom: .5em
    line-height: 1.3em
  ol, ul, blockquote, p, h2, h3, h4
    &.ql-indent-1
      margin-left: 2em
    &.ql-indent-2
      margin-left: 4em
    &.ql-indent-3
      margin-left: 6em
    &.ql-indent-4
      margin-left: 8em
    &.ql-align-center
      text-align: center
    &.ql-align-right
      text-align: right
    &.ql-align-justify
      text-align: justify
      img
        width: 100%

  iframe.ql-video
    width: 100%
    max-width: 920px
    aspect-ratio: 16/9
    display: block
    &.ql-align-justify
      max-width: unset
    &.ql-align-center
      margin: 0 auto
    &.ql-align-right
      margin-left: auto
  img
    max-width: 100%
  code
    color: rgb(var(--v-theme-secondary))

.richtext,
.ql-editor
  p
    font-size: 10.5pt
    line-height: 1.5
  .mention
    background-color: rgba(var(--v-theme-primary), .3)
    white-space: nowrap
    padding: .05em .6em
    border-radius: 4px
    font-size: 10pt

</style>
