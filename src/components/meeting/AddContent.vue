<template>
  <BtnDropdown ref="dropdownComponent" :title="t('content.addName', { name })" @open="editorComponent.focus()">
    <form @submit.prevent="submit()">
      <RichtextEditor ref="editorComponent" v-model="text" @submit="submit()" :tags="tags" />
      <div class="buttons">
        <Btn sm icon="mdi-send" :disabled="disabled" @click="submit()">{{ t('post') }}</Btn>
      </div>
    </form>
  </BtnDropdown>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType, ref } from 'vue'

import { dialogQuery } from '@/utils'

import BtnDropdown from '../BtnDropdown.vue'
import RichtextEditor from '../widgets/RichtextEditor.vue'

export default defineComponent({
  name: 'AddContent',
  components: {
    BtnDropdown,
    RichtextEditor
  },
  props: {
    name: String,
    handler: {
      type: Function as PropType<(body: string) => Promise<any>>,
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
    const text = ref('')
    const disabled = ref(false)

    function textContent (html: string) {
      const tmp = document.createElement('div')
      tmp.innerHTML = html
      return tmp.textContent || tmp.innerText || ''
    }
    const textLength = computed(() => textContent(text.value).length)

    async function submit (override = false) {
      if (disabled.value) return
      if (override || textLength.value >= props.warnLength) {
        disabled.value = true
        try {
          await props.handler(text.value)
          editorComponent.value.clear()
          dropdownComponent.value.isOpen = false
        } catch (err) {
          console.error(err)
        }
        disabled.value = false
      } else {
        if (await dialogQuery(t('content.warnShorterThan', { length: props.warnLength }))) submit(true)
      }
    }

    const editorComponent = ref<any>(null)
    const dropdownComponent = ref<any>(null)

    return {
      t,
      disabled,
      open,
      focus,
      submit,
      text,
      editorComponent,
      dropdownComponent
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
