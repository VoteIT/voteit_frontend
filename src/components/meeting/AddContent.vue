<template>
  <BtnDropdown ref="dropdownComponent" :title="t('content.addName', { name })" @open="editorComponent.focus()">
    <form @submit.prevent="submit()">
      <RichtextEditor ref="editorComponent" v-model="text" @submit="submit()" :tags="tags" />
      <div class="buttons">
        <Btn sm icon="send" :disabled="submitDisabled">{{ t('post') }}</Btn>
      </div>
    </form>
  </BtnDropdown>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType, ref } from 'vue'

import { dialogQuery } from '@/utils'

import BtnDropdown from '../BtnDropdown.vue'
import RichtextEditor from '../widgets/RichtextEditor.vue'
import ContentType from '@/contentTypes/ContentType'

export default defineComponent({
  name: 'AddContent',
  components: {
    BtnDropdown,
    RichtextEditor
  },
  props: {
    name: String,
    // For channels:
    contextPk: {
      type: Number,
      required: true
    },
    contentType: {
      type: ContentType,
      required: true
    },
    minLength: {
      type: Number,
      default: 1
    },
    warnLength: {
      type: Number,
      default: 10
    },
    tags: Set as PropType<Set<string>>
  },
  setup (props) {
    const t = inject('t') as CallableFunction
    // Post (data update from channels)
    const channel = props.contentType.getChannel()
    const submitting = ref(false)
    const text = ref('')

    function textContent (html: string) {
      const tmp = document.createElement('div')
      tmp.innerHTML = html
      return tmp.textContent || tmp.innerText || ''
    }

    const textLength = computed(() => textContent(text.value).length)
    const submitDisabled = computed(() => submitting.value || textLength.value < props.minLength)

    function submit (override?: boolean) {
      if (submitDisabled.value) return
      if (override || textLength.value >= props.warnLength) {
        const body = text.value
        submitting.value = true
        channel.add(props.contextPk, {
          body
        })
          .then(() => {
            editorComponent.value.clear()
            dropdownComponent.value.isOpen = false
          })
          .finally(() => {
            submitting.value = false
          })
      } else {
        dialogQuery(t('content.warnShorterThan', { length: props.warnLength }))
          .then(() => submit(true))
      }
    }

    const editorComponent = ref<any>(null)
    const dropdownComponent = ref<any>(null)

    return {
      t,
      open,
      focus,
      submitting,
      submit,
      text,
      editorComponent,
      dropdownComponent,
      submitDisabled
    }
  }
})
</script>

<style lang="sass" scoped>
textarea
  width: 100%
  height: 8em
  border: var(--widget-border)
  &:focus
    outline: var(--widget-border)
.buttons
  text-align: right
</style>
