<template>
  <div class="page-dropdown">
    <div v-if="$slots.actions" class="d-flex">
      <v-btn
        :class="{ isOpen }"
        class="collapse flex-grow-1"
        prepend-icon="mdi-chevron-right"
        :text="title"
        variant="text"
        @click="toggle"
      />
      <slot name="actions"></slot>
    </div>
    <v-btn
      v-else
      block
      class="collapse"
      :class="{ isOpen }"
      prepend-icon="mdi-chevron-right"
      :title="title"
      variant="text"
      @click="toggle"
    />
    <v-expand-transition>
      <div class="dropdown-content" v-show="isOpen">
        <slot v-if="eager || isOpen"></slot>
      </div>
    </v-expand-transition>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const props = defineProps<{
  eager?: boolean
  modelValue?: boolean
  title?: string
}>()
const emit = defineEmits(['update:modelValue'])

const isOpen = ref(props.modelValue)
function toggle() {
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
