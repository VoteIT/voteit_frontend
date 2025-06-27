<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStorage } from '@vueuse/core'

const props = defineProps<{
  id: string
  startOpen?: boolean
  modal?: boolean
  modelValue?: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const dismissedHelpIds = useStorage<string[]>('dismissedHelpIds', [])
const isDismissed = computed(() => dismissedHelpIds.value.includes(props.id))
const isOpen = ref(
  (props.startOpen && !isDismissed.value) || !!props.modelValue
)

function toggle() {
  if (props.modal) {
    return
  }
  if (isOpen.value && !isDismissed.value) dismissedHelpIds.value.push(props.id)
  isOpen.value = !isOpen.value
}
</script>

<template>
  <v-btn
    v-if="modal"
    size="small"
    icon="mdi-help"
    @click="toggle"
    variant="tonal"
  />
  <v-sheet
    v-else
    :color="isOpen ? 'secondary-lighten-2' : 'transparent'"
    rounded
    class="container"
  >
    <div class="d-flex">
      <v-expand-transition>
        <div v-if="isOpen">
          <div class="ma-6 content-wrapper">
            <slot></slot>
          </div>
        </div>
      </v-expand-transition>
      <v-spacer />
      <v-btn
        size="small"
        :icon="isOpen ? 'mdi-close' : 'mdi-help'"
        @click="toggle"
        :variant="isOpen ? 'text' : 'tonal'"
      />
    </div>
  </v-sheet>
</template>

<style scoped lang="sass">
.container
  transition: background 250ms

.content-wrapper
  overflow: hidden
</style>
