<script setup lang="ts" generic="T extends string | boolean">
import { shallowRef, watch } from 'vue'
import DefaultDialog from './DefaultDialog.vue'

const props = defineProps<{
  description: string
  handler(value: T): Promise<void>
  modelValue: boolean
  options: {
    color: string
    icon: string
    title: string
    value: T
  }[]
  title: string
}>()

const dialogActive = shallowRef(props.modelValue)

// React to change of modelValue
watch(
  () => props.modelValue,
  (value) => {
    dialogActive.value = value
  }
)

async function selectValue(value: T) {
  await props.handler(value)
  dialogActive.value = false
}
</script>

<template>
  <DefaultDialog persistent :title="title" v-model="dialogActive">
    <p class="mb-4">{{ description }}</p>
    <div class="d-flex ga-2">
      <v-sheet
        v-for="{ color, icon, title, value } in options"
        class="cursor-pointer text-center pa-6 w-50"
        color="background"
        rounded
        @click="selectValue(value)"
        v-ripple="{ class: `text-${color}` }"
      >
        <v-icon class="my-3" :color="color" :icon="icon" size="x-large" />
        <p>{{ title }}</p>
      </v-sheet>
    </div>
  </DefaultDialog>
</template>
