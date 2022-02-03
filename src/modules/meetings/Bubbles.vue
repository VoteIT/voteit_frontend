<template>
  <div style="height: 64px" />
  <div id="bubbles">
    <v-overlay
      v-for="component in bubbles" :key="component.id"
      eager
      transition="bubble-content"
      scroll-strategy="reposition" position-strategy="connected" origin="bottom end" anchor="top end"
      :scrim="false"
      :modelValue="component.id === openBubble" @update:modelValue="setOpen(component, $event)"
    >
      <template #activator="{ props, isActive }">
        <v-btn
          v-show="activeBubbles[component.id]"
          v-bind="props"
          :icon="component.icon"
          class="activator"
          :class="{ open: isActive, attention: !isActive && attentionBubbles[component.id] }"
        />
      </template>
      <v-sheet rounded class="pa-4 mb-3" elevation="8">
        <component
          :is="component"
          v-model="activeBubbles[component.id]"
          v-model:attention="attentionBubbles[component.id]"
          @update:open="setOpen(component, $event)"
        />
      </v-sheet>
    </v-overlay>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from 'vue'

import { BubbleComponent } from './types'
import useBubbles from './useBubbles'

const { bubbles } = useBubbles()

export default defineComponent({
  setup () {
    const openBubble = ref<string | null>(null)
    const activeBubbles = reactive<Record<string, boolean>>(Object.fromEntries(bubbles.map(b => [b.id, false])))
    const attentionBubbles = reactive<Record<string, boolean>>(Object.fromEntries(bubbles.map(b => [b.id, false])))

    function setOpen (component: BubbleComponent, value: boolean) {
      openBubble.value = value
        ? component.id
        : null
    }

    return {
      activeBubbles,
      attentionBubbles,
      bubbles,
      openBubble,
      setOpen
    }
  }
})
</script>

<style lang="sass">
@keyframes attention
  0%
    transform: scale(1)
    filter: brightness(100%)
  60%
    transform: scale(1)
    filter: brightness(100%)
  65%
    transform: scale(1.1)
    filter: brightness(75%)
  100%
    transform: scale(1)
    filter: brightness(100%)

#bubbles
  position: fixed
  z-index: 3
  right: 0
  bottom: 0
  padding: 10px
  display: flex
  flex-flow: row-reverse
  // overflow-x: auto

  .activator
    position: relative
    background-color: rgb(var(--v-theme-surface))
    border: 1px solid rgba(var(--v-theme-on-surface), .4)
    color: rgb(var(--v-theme-on-surface))
    height: 64px
    width: 64px
    border-radius: 50%
    &:focus
      outline: none
    &.attention
      animation: attention 4s infinite
    &.open
      background-color: rgb(var(--v-theme-on-surface))
      color: rgb(var(--v-theme-surface))

    margin-left: 10px
    &:last-child
      margin-left: 0

.bubble-content-enter-active,
.bubble-content-leave-active
  transition: opacity .2s ease, transform .3s ease

.bubble-content-enter-from
  opacity: 0
  transform: translate(2%)
.bubble-content-leave-to
  opacity: 0
  transform: rotate(4deg) scale(1.4) translate(-20%)
</style>
