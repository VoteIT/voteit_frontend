<script setup lang="ts">
import { computed, inject } from 'vue'

import stringToHSL from '@/utils/stringToHSL'
import { TagClickHandlerKey } from '@/modules/meetings/useTags'

const clickHandler = inject(TagClickHandlerKey, undefined)

defineEmits(['remove'])
const props = defineProps<{
  name: string
  disabled?: boolean
  closer?: boolean
  count?: number
}>()

const color = computed(() => stringToHSL(props.name))
const clickable = computed(() => !!clickHandler && !props.disabled)
const badge = computed(() => !!props.count)
const badgeContent = computed(() => String(props.count))

function onClick() {
  if (clickable.value) clickHandler?.(props.name)
}
</script>

<template>
  <v-badge
    :model-value="badge"
    :content="badgeContent"
    offset-x="-5"
    offset-y="-2"
    color="secondary"
  >
    <v-chip
      :class="{ disabled }"
      :closable="closer"
      :color="color"
      :link="clickable"
      :ripple="clickable"
      data-denotation-char="#"
      :data-value="name"
      size="x-small"
      variant="flat"
      @click="onClick"
      @click:close="$emit('remove')"
    >
      #{{ name }}
    </v-chip>
  </v-badge>
</template>
