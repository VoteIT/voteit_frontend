<script setup lang="ts">
import { computed, ref, watchEffect, type ComponentPublicInstance } from 'vue'
import { useElementSize } from '@vueuse/core'
import { getImageRelativePosition } from './utils'

const props = withDefaults(
  defineProps<{
    active?: boolean
    aspectRatio?: string
    src?: string
    position?: { x: number; y: number }
    rounded?: true
  }>(),
  {
    aspectRatio: '1',
    position: () => ({ x: 0.5, y: 0.5 })
  }
)

const style = computed(() => {
  if (props.src)
    return {
      aspectRatio: props.aspectRatio,
      backgroundImage: `url(${props.src})`,
      backgroundPosition: `${pos.value.x * 100}% ${pos.value.y * 100}%`
    }
  return {
    aspectRatio: props.aspectRatio
  }
})

const pos = ref(props.position)
const root = ref<ComponentPublicInstance>()
const { height, width } = useElementSize(root)

watchEffect(async () => {
  if (!props.src || !width.value) return
  pos.value = await getImageRelativePosition(
    props.position,
    width.value,
    height.value,
    props.src
  )
})
</script>

<template>
  <v-sheet
    class="image-container"
    :color="src ? 'transparent' : undefined"
    :elevation="active ? 8 : undefined"
    ref="root"
    :rounded="rounded"
    :style="style"
  >
    <slot></slot>
  </v-sheet>
</template>

<style lang="sass" scoped>
.image-container
  background-size: cover
</style>
