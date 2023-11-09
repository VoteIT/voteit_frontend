<template>
  <teleport to="#toolbar">
    <v-toolbar
      color="secondary-lighten-2"
      elevation="1"
      class="text-black"
      :title="title"
    >
      <slot></slot>
      <template v-if="$slots.extension" #extension>
        <slot name="extension"></slot>
      </template>
    </v-toolbar>
  </teleport>
</template>

<script setup lang="ts">
interface Props {
  title?: string
}

defineProps<Props>()
</script>
