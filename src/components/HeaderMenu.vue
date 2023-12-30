<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  subtitle?: string
}>()
</script>

<template>
  <v-sheet>
    <div class="d-flex pa-1 mt-4 mx-4 mb-2">
      <v-icon
        :icon="icon"
        size="xx-large"
        color="secondary"
        class="mr-4 mt-1"
      />
      <div class="flex-grow-1">
        <h2>{{ title }}</h2>
        <p v-if="subtitle" class="text-secondary">
          {{ subtitle }}
        </p>
      </div>
    </div>
    <v-divider />
    <slot></slot>
  </v-sheet>
</template>
