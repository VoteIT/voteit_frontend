<template>
  <div class="add-content">
    <UserAvatar size="small" class="mr-1" />
    <RichtextEditor ref="editorComponent"
      :placeholder="placeholder"
      :disabled="disabled" v-model="text" submit @submit="submit()">
      <template v-slot:controls>
        <div class="d-flex justify-space-between">
          <div class="mt-1">
            <Tag v-for="tag in tags" :key="tag" :name="tag" class="mr-1" :closer="tag !== setTag" @remove="tags.delete(tag)" />
            <input type="text" class="tag-input" :placeholder="t('addTag')" v-model="newTag" @keydown.enter="addTag()">
          </div>
          <v-btn color="primary" :disabled="disabled" :prepend-icon="submitIcon" size="small" class="mr-1" @click="submit()">{{ submitText }}</v-btn>
        </div>
      </template>
    </RichtextEditor>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery, stripHTML, slugify } from '@/utils'

import RichtextEditor from './RichtextEditor.vue'
import { EditorComponent } from './types'
import Tag from './Tag.vue'

function cleanTag (value: string): string {
  return slugify(value.replaceAll(/[^\w\s]+/g, ''))
}

export default defineComponent({
  name: 'AddContent',
  components: {
    RichtextEditor,
    Tag
  },
  props: {
    name: String,
    handler: {
      type: Function as PropType<(body: string, tags: string[]) => Promise<void>>,
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
    },
    setTag: String
  },
  setup (props, { emit }) {
    const { t } = useI18n()
    const text = ref(props.modelValue)
    const submitting = ref(false)

    // eslint-disable-next-line vue/no-setup-props-destructure
    const newTag = ref('')
    const tags = reactive(new Set(props.setTag ? [props.setTag] : []))
    function addTag (name?: string) {
      const tag = cleanTag(name ?? newTag.value)
      if (!tag.length) return
      tags.add(tag)
      newTag.value = ''
    }

    const textLength = computed(() => stripHTML(text.value).length)
    const disabled = computed(() => submitting.value || textLength.value < props.minLength)

    async function submit (override = false) {
      if (disabled.value) return
      if (override || textLength.value >= props.warnLength) {
        submitting.value = true
        try {
          await props.handler(text.value, [...tags])
          editorComponent.value?.setText(props.modelValue)
        } catch (err) {
          console.error(err)
        }
        submitting.value = false
        tags.clear()
        if (props.setTag) tags.add(props.setTag)
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
      editorComponent,
      newTag,
      tags,
      text,
      addTag,
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

  .tag-input
    padding: 0 .3em
    width: 10em
    background-color: rgba(var(--v-theme-surface), 0)
    transition: background-color .5s
    &:focus
      background-color: rgba(var(--v-theme-surface), 1)
</style>
