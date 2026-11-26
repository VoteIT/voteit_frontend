<script setup lang="ts">
import { slugify } from '@/utils'

const model = defineModel<string>({ default: '' })

function cleanInput() {
  model.value = slugify(model.value)
}
</script>

<template>
  <v-text-field
    v-model="model"
    @update:focused="cleanInput"
    @keydown.enter="cleanInput"
  />
</template>
