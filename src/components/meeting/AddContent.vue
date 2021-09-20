<template>
  <div class="add-content">
    <UserAvatar size="small" class="mr-1" />
    <RichtextEditor ref="editorComponent" submit
      :placeholder="placeholder"
      :disabled="disabled" v-model="text" @submit="submit()"
      :submitText="submitText" :submitIcon="submitIcon" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery, stripHTML } from '@/utils'

import RichtextEditor from '../widgets/RichtextEditor.vue'
import { EditorComponent } from '../widgets/types'

export default defineComponent({
  name: 'AddContent',
  components: {
    RichtextEditor
  },
  props: {
    name: String,
    handler: {
      type: Function as PropType<(body: string) => Promise<any>>,
      required: true
    },
    modelValue: {
      type: String,
      default: ''
    },
    submitText: String,
    submitIcon: String,
    placeholder: String,
    minLength: {
      type: Number,
      default: 1
    },
    warnLength: {
      type: Number,
      default: 10
    }
  },
  setup (props, { emit }) {
    const { t } = useI18n()
    const text = ref(props.modelValue)
    const submitting = ref(false)

    const textLength = computed(() => stripHTML(text.value).length)
    const disabled = computed(() => submitting.value || textLength.value < props.minLength)

    async function submit (override = false) {
      if (disabled.value) return
      if (override || textLength.value >= props.warnLength) {
        submitting.value = true
        try {
          await props.handler(text.value)
          editorComponent.value?.setText(props.modelValue)
        } catch (err) {
          console.error(err)
        }
        submitting.value = false
      } else {
        if (await dialogQuery(t('content.warnShorterThan', { length: props.warnLength }))) submit(true)
      }
    }

    function focus () {
      if (editorComponent.value) editorComponent.value.focus()
    }

    const editorComponent = ref<null | EditorComponent>(null)
    watch(text, value => {
      emit('update:modelValue', value)
    })

    return {
      t,
      disabled,
      text,
      editorComponent,
      focus,
      open,
      submit
    }
  }
})
</script>

<style lang="sass">
.add-content
  display: flex
  .richtext-editor
    flex: 1 1 auto
</style>
