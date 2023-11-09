<script setup lang="ts">
import { computed } from 'vue'

import stringToHSL from '@/utils/stringToHSL'
import { tagClickEvent } from '@/modules/meetings/useTags'

defineEmits(['remove'])
const props = defineProps<{
  name: string
  disabled?: boolean
  closer?: boolean
  count?: number
}>()

const style = computed(() => ({ backgroundColor: stringToHSL(props.name) }))
const badge = computed(() => !!props.count)
const badgeContent = computed(() => String(props.count))
</script>

<template>
  <v-badge
    :model-value="badge"
    :content="badgeContent"
    offset-x="-5"
    offset-y="-2"
    color="secondary"
  >
    <span
      class="voteit-tag"
      :class="{ disabled }"
      :style="style"
      data-denotation-char="#"
      :data-value="name"
      @click="tagClickEvent.emit(name)"
    >
      <v-icon size="x-small" icon="mdi-tag-outline" />
      #{{ name }}
      <v-icon
        v-if="closer"
        size="x-small"
        icon="mdi-close"
        @click.stop="$emit('remove')"
      />
    </span>
  </v-badge>
</template>

<style lang="sass" scoped>
.voteit-tag
  white-space: nowrap
  padding: .2em .6em
  border-radius: 4px
  color: #000
  font-size: 10pt

span[data-denotation-char="#"]:not(.disabled)
  user-select: unset
  cursor: pointer

.mdi-close
  position: relative
  top: -2px
  left: 5px
</style>
