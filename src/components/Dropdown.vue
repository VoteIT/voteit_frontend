<template>
  <div class="page-dropdown">
    <div v-if="$slots.actions" class="d-flex">
      <v-btn prepend-icon="mdi-chevron-right" variant="text" @click="toggle" class="collapse flex-grow-1" :class="{ isOpen }">
        {{ title }}
      </v-btn>
      <slot name="actions"></slot>
    </div>
    <v-btn v-else prepend-icon="mdi-chevron-right" variant="text" block @click="toggle" class="collapse" :class="{ isOpen }">
      {{ title }}
    </v-btn>
    <v-expand-transition>
      <div class="dropdown-content" v-show="isOpen">
        <slot></slot>
      </div>
    </v-expand-transition>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const props = defineProps<{ modelValue?: boolean, title?: string }>()
const emit = defineEmits(['update:modelValue'])

const isOpen = ref(props.modelValue)
function toggle () {
  isOpen.value = !isOpen.value
  emit('update:modelValue', isOpen.value)
}
</script>

<style lang="sass">
.page-dropdown
  .collapse
    justify-content: left
    font-size: 12pt
    font-weight: normal
    .mdi-chevron-right
      transform: rotate(0deg)
      transition: transform .2s
    &.isOpen .mdi-chevron-right
      transform: rotate(90deg)
</style>
