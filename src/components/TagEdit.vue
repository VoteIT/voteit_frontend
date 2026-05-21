<script setup lang="ts">
import { inject, reactive, ref, watch } from 'vue'
import { ValidationResult } from 'vuetify/lib/composables/validation'

import { tagify } from '@/utils'

import Tag from './Tag.vue'
import { TagsKey } from '@/modules/meetings/useTags'

let uid = 0

const emit = defineEmits(['update:modelValue'])
const props = withDefaults(
  defineProps<{
    errorMessages?: string[]
    label?: string
    modelValue?: string[]
    rules?: ((value: string[]) => ValidationResult)[]
    setTag?: string
  }>(),
  {
    modelValue: () => []
  }
)

const allTags = inject(TagsKey)
uid++

const newTag = ref('')
const tags = reactive(
  new Set(props.setTag ? [props.setTag, ...props.modelValue] : props.modelValue)
)
function addTag(name?: string) {
  const tag = tagify(name ?? newTag.value)
  if (!tag.length) return
  tags.add(tag)
  newTag.value = ''
}

watch(tags, (value) => {
  emit('update:modelValue', [...value])
})
watch(
  () => props.modelValue,
  (value) => {
    for (const tag of value) {
      tags.add(tag)
    }
    for (const existing of tags.values()) {
      if (!value.includes(existing)) tags.delete(existing)
    }
  }
)

function detectTagClick(evt: Event) {
  if (
    !(evt instanceof InputEvent) || // Chromium
    evt.inputType === 'insertReplacementText' // Firefox
  )
    addTag()
}

const tagUid = `tagdata-${uid.toString()}`
</script>

<template>
  <v-input
    :class="{ 'mb-4': !!label }"
    :error-messages="errorMessages"
    :rules="rules"
    :model-value="tags"
  >
    <div class="d-flex flex-wrap ga-1">
      <v-label v-if="label" :text="label" />
      <Tag
        v-for="tag in tags"
        :key="tag"
        :name="tag"
        :closer="tag !== setTag"
        @remove="tags.delete(tag)"
      />
      <input
        :list="tagUid"
        type="text"
        class="tag-input"
        :placeholder="$t('addTag')"
        v-model="newTag"
        @keydown.enter.prevent="addTag()"
        @input="detectTagClick"
      />
      <datalist :id="tagUid">
        <option v-for="tag in allTags" :key="tag" :value="tag"></option>
      </datalist>
    </div>
  </v-input>
</template>

<style lang="sass" scoped>
.tag-input
  padding: 0 .3em
  width: 10em
  background-color: rgba(var(--v-theme-surface), 0)
  border: 1px solid (rgb(var(--v-border-color)))
  border-radius: 4px
  transition: background-color 250ms
  &:focus
    background-color: rgba(var(--v-theme-surface), 1)
</style>
