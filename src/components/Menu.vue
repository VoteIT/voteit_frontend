<template>
  <span class="context-menu" ref="elem" v-if="items.length || $slots.top || $slots.bottom">
    <v-btn :outlined="isOpen" :color="working === null ? color : 'secondary'" :icon="working === null ? 'mdi-dots-horizontal' : 'mdi-loading'" @click="isOpen = !isOpen"/>
    <v-sheet rounded elevation="4" v-show="isOpen" ref="overlay" :class="{ onTop }">
      <slot name="top"/>
      <template v-for="(item, i) in items" :key="i">
        <v-divider v-if="item === '---'" />
        <v-btn v-else :color="item.color" plain block :disabled="item.disabled || working !== null" @click="clickItem(item)">
          <v-icon v-if="item.icon" left :icon="item.icon"/>
          {{ item.text }}
        </v-btn>
      </template>
      <slot name="bottom"/>
    </v-sheet>
  </span>
</template>

<script lang="ts">
import useClickControl from '@/composables/useClickControl'
import { MenuItem, MenuDescriptor } from '@/utils/types'
import { ComponentPublicInstance, defineComponent, nextTick, PropType, ref, watch } from 'vue'

export default defineComponent({
  props: {
    items: {
      type: Array as PropType<MenuItem[]>,
      default: () => []
    },
    color: {
      type: String,
      default: 'primary'
    }
  },
  setup (props) {
    const isOpen = ref(false)
    const onTop = ref(false)
    const elem = ref<HTMLElement | null>(null)
    const working = ref<number | null>(null)

    useClickControl({
      element: elem,
      callback: () => {
        isOpen.value = false
      }
    })

    const overlay = ref<ComponentPublicInstance | null>(null)
    watch(isOpen, value => {
      if (!value) return
      nextTick(() => {
        if (!overlay.value) return
        const elem = overlay.value.$el as HTMLElement
        const rect = elem.getBoundingClientRect()
        if (rect.bottom > window.innerHeight) {
          onTop.value = true
        }
      })
    })

    async function clickItem (item: MenuDescriptor) {
      working.value = props.items.indexOf(item)
      await item.onClick()
      working.value = null
      isOpen.value = false
    }

    return {
      onTop,
      clickItem,
      elem,
      isOpen,
      overlay,
      working
    }
  }
})
</script>

<style lang="sass">
@keyframes rotate
  0%
    transform: rotate(45deg)
  100%
    transform: rotate(405deg)

.context-menu
  position: relative
  display: inline-block
  .v-sheet
    z-index: 99
    position: absolute
    min-width: 200px
    top: 50px
    right: 0
    background-color: rgb(var(--v-theme-surface))
    &.onTop
      top: unset
      bottom: 50px
    button
      justify-content: left
      white-space: nowrap
  .mdi-loading
    animation: rotate 2s ease-in-out infinite
</style>
