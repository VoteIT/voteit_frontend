<template>
  <BtnDropdown ref="dropdownComponent" :title="t('content.addName', { name })" @open="editorComponent.focus()">
    <RichtextEditor ref="editorComponent" submit :disabled="disabled" v-model="text" @submit="submit()" :tags="tags" />
  </BtnDropdown>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue'

import { dialogQuery, stripHTML } from '@/utils'

import BtnDropdown from '../BtnDropdown.vue'
import RichtextEditor from '../widgets/RichtextEditor.vue'
import { useI18n } from 'vue-i18n'

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
    const { t } = useI18n()
    const text = ref('')
    const submitting = ref(false)

    const textLength = computed(() => stripHTML(text.value).length)
    const disabled = computed(() => submitting.value || textLength.value < props.minLength)

    async function submit (override = false) {
      if (disabled.value) return
      if (override || textLength.value >= props.warnLength) {
        submitting.value = true
        try {
          await props.handler(text.value)
          editorComponent.value.clear()
          dropdownComponent.value.isOpen = false
        } catch (err) {
          console.error(err)
        }
        submitting.value = false
      } else {
        if (await dialogQuery(t('content.warnShorterThan', { length: props.warnLength }))) submit(true)
      }
    }

    // FIXME Don't know how to type there correctly
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
  border: var(--v-theme-divider)
  &:focus
    outline: var(--v-theme-divider)
.buttons
  text-align: right
</style>
