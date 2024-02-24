<script setup lang="ts">
defineProps<{
  color?: string
  size?: 'small'
  text: string
}>()
</script>

<template>
  <span>
    <v-btn
      :color="color"
      :size="size"
      :text="text"
      class="rounded-e-0 pr-2"
      variant="flat"
      v-bind="$attrs"
    />
    <v-menu location="bottom right">
      <template #activator="{ props }">
        <v-btn
          :color="color"
          :size="size"
          variant="flat"
          v-bind="props"
          class="rounded-s-0 px-2"
        >
          <v-icon>mdi-chevron-down</v-icon>
        </v-btn>
      </template>
      <slot></slot>
    </v-menu>
  </span>
</template>
