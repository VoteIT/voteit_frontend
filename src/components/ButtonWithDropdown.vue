<script setup lang="ts">
defineProps<{
  /** Fill the width of whatever it's in. */
  block?: boolean
  color?: string
  disabled?: boolean
  /** Accessible name for the dropdown toggle. */
  menuLabel?: string
  size?: 'small'
  text: string
}>()

defineOptions({ inheritAttrs: false })
</script>

<template>
  <span class="text-no-wrap" :class="block ? 'd-flex w-100' : 'd-inline-flex'">
    <v-btn
      :color="color"
      :disabled="disabled"
      :size="size"
      :text="text"
      :class="{ 'flex-grow-1': block, 'rounded-e-0 pr-2': $slots.default }"
      variant="flat"
      v-bind="$attrs"
    />
    <v-menu v-if="$slots.default" location="bottom end">
      <template #activator="{ props }">
        <v-btn
          :aria-label="menuLabel"
          :color="color"
          :disabled="disabled"
          :size="size"
          variant="flat"
          v-bind="props"
          class="rounded-s-0 chevron pl-2 pr-3"
        >
          <v-icon>mdi-chevron-down</v-icon>
        </v-btn>
      </template>
      <slot></slot>
    </v-menu>
  </span>
</template>

<style lang="sass" scoped>
.chevron
  min-width: 0 !important
</style>
