<template>
  <div>
    <Tag v-for="tag in tags" :key="tag" :name="tag" class="mr-1" :closer="tag !== setTag" @remove="tags.delete(tag)" />
    <input :list="tagUid" type="text" class="tag-input" :placeholder="t('addTag')" v-model="newTag" @keydown.enter="addTag()" @input="detectTagClick">
    <datalist :id="tagUid">
      <option v-for="tag in allTags" :key="tag" :value="tag" />
    </datalist>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, PropType, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { tagify } from '@/utils'

import Tag from './Tag.vue'
import { TagsKey } from '@/modules/meetings/useTags'

let uid = 0

export default defineComponent({
  emits: ['update:modelValue'],
  components: {
    Tag
  },
  props: {
    modelValue: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    setTag: String // This tag is preset and required
  },
  setup (props, { emit }) {
    const { t } = useI18n()
    const allTags = inject(TagsKey)
    uid++

    const newTag = ref('')
    const tags = reactive(new Set(props.setTag ? [props.setTag, ...props.modelValue] : props.modelValue))
    function addTag (name?: string) {
      const tag = tagify(name ?? newTag.value)
      if (!tag.length) return
      tags.add(tag)
      newTag.value = ''
    }

    watch(tags, value => {
      emit('update:modelValue', [...value])
    })
    // !!! This causes infinite recursive updates
    // watch(() => props.modelValue, value => {
    //   tags.clear()
    //   for (const tag of value) {
    //     tags.add(tag)
    //   }
    // })

    function detectTagClick (evt: Event) {
      if (
        !(evt instanceof InputEvent) || // Chromium
        evt.inputType === 'insertReplacementText' // Firefox
      ) addTag()
    }

    return {
      t,
      allTags,
      newTag,
      tags,
      tagUid: `tagdata-${uid.toString()}`,
      detectTagClick,
      addTag
    }
  }
})
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
