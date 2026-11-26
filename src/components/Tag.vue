<script setup lang="ts">
import { computed, inject } from 'vue'

import stringToHSL from '@/utils/stringToHSL'
import { TagClickHandlerKey } from '@/modules/meetings/useTags'

const clickHandler = inject(TagClickHandlerKey, undefined)

const emit = defineEmits<{ remove: [] }>()
const props = defineProps<{
  name: string
  disabled?: boolean
  closer?: boolean
  count?: number
}>()

const chipProps = computed(() => {
  const clickable = !!clickHandler && !props.disabled
  const onClick = clickable ? () => clickHandler(props.name) : undefined

  return {
    closable: props.closer,
    color: stringToHSL(props.name),
    'data-denotation-char': '#',
    'data-value': props.name,
    size: 'x-small',
    text: `#${props.name}`,
    variant: 'flat' as const,
    onClick,
    'onClick:close': () => emit('remove')
  }
})
</script>

<template>
  <v-badge
    v-if="count"
    :content="String(count)"
    offset-x="-5"
    offset-y="-2"
    color="secondary"
  >
    <v-chip v-bind="chipProps" />
  </v-badge>
  <v-chip v-else v-bind="chipProps" />
</template>
