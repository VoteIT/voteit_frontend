<script setup lang="ts">
import { computed, ref } from 'vue'

import { MenuItem, MenuSubheader } from '@/utils/types'

const props = withDefaults(
  defineProps<{
    color?: string
    float?: boolean
    icon?: string
    items?: MenuItem[]
    position?: 'auto' | 'top' | 'bottom'
    size?: 'small' | 'x-small'
  }>(),
  {
    icon: 'mdi-dots-vertical',
    items() {
      return []
    },
    position: 'auto'
  }
)

const isOpen = ref(false)
const working = ref(false)

const openerAttrs = computed(() => ({
  icon: working.value ? 'mdi-loading' : props.icon,
  color: working.value ? 'secondary' : props.color,
  size: props.size
}))

function isSubheader(item: MenuItem): item is MenuSubheader {
  return item !== '---' && 'subheader' in item
}
</script>

<template>
  <div class="context-menu">
    <v-menu
      v-if="items.length || $slots.top || $slots.bottom"
      location="bottom end"
      v-model="isOpen"
    >
      <template #activator="{ props }">
        <v-btn v-bind="{ ...props, ...openerAttrs }" variant="text" />
      </template>
      <v-list density="comfortable">
        <slot name="top"></slot>
        <template v-for="(item, i) in items" :key="i">
          <v-divider v-if="item === '---'" />
          <v-list-subheader v-else-if="isSubheader(item)">
            {{ item.subheader }}
          </v-list-subheader>
          <v-list-item v-else link v-bind="item" />
        </template>
        <slot name="bottom"></slot>
      </v-list>
    </v-menu>
  </div>
</template>

<style lang="sass" scoped>
@keyframes rotate
  0%
    transform: rotate(45deg)
  100%
    transform: rotate(405deg)

.mdi-loading
  animation: rotate 2s ease-in-out infinite
</style>
