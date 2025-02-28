<template>
  <div :class="{ 'mb-4': !!label }">
    <div class="d-flex flex-wrap ga-1">
      <p v-if="label" class="text-secondary">
        <label>{{ label }}</label>
      </p>
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
  </div>
</template>

<script setup lang="ts">
import { inject, reactive, ref, watch } from 'vue'

import { tagify } from '@/utils'

import Tag from './Tag.vue'
import { TagsKey } from '@/modules/meetings/useTags'

let uid = 0

const emit = defineEmits(['update:modelValue'])
const props = withDefaults(
  defineProps<{
    label?: string
    modelValue?: string[]
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

<style lang="sass" scoped>
.tag-input
  padding: 0 .3em
  width: 10em
  background-color: rgba(var(--v-theme-surface), 0)
  transition: background-color .5s
  &:focus
    background-color: rgba(var(--v-theme-surface), 1)
</style>
