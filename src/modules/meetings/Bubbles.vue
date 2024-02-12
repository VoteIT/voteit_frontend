<template>
  <div style="height: 64px"></div>
  <div id="bubbles" class="d-print-none">
    <v-overlay
      v-for="{ component, id, icon, requireAttention } in bubbles"
      :key="id"
      eager
      transition="bubble-content"
      scroll-strategy="reposition"
      location-strategy="connected"
      location="bottom end"
      anchor="top end"
      :scrim="false"
      :modelValue="id === openBubble"
      @update:modelValue="setOpen(id, $event)"
    >
      <template #activator="{ props, isActive }">
        <v-btn
          v-bind="props"
          :icon="icon"
          class="activator"
          :class="{ open: isActive, attention: requireAttention }"
        />
      </template>
      <v-sheet rounded class="pa-4 mb-3" elevation="8">
        <component :is="component" @update:modelValue="setOpen(id, $event)" />
      </v-sheet>
    </v-overlay>
  </div>
</template>

<script setup lang="ts">
import { sortBy } from 'lodash'
import { computed, ref } from 'vue'

import { meetingBubblePlugins } from './registry'

import useMeeting from './useMeeting'

const { meeting } = useMeeting()
const activePlugins = computed(() =>
  meeting.value
    ? sortBy(meetingBubblePlugins.getActivePlugins(meeting.value), 'order')
    : []
)

const bubbles = computed(() =>
  activePlugins.value.map((plugin) => {
    return {
      ...plugin,
      requireAttention: plugin.requireAttention.value
    }
  })
)

const openBubble = ref<string | null>(null)

function setOpen(id: string, value: boolean) {
  openBubble.value = value ? id : null
}
</script>

<style lang="sass">
@keyframes attention
  0%
    transform: scale(1)
    filter: brightness(100%)
  30%
    transform: scale(1)
    filter: brightness(100%)
  45%
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
    border: 1px solid rgba(var(--v-theme-app-bar), .4)
    color: rgb(var(--v-theme-app-bar))
    height: 64px
    width: 64px
    border-radius: 50%
    &:focus
      outline: none
    &.attention
      animation: attention 2s infinite
    &.open
      background-color: rgb(var(--v-theme-app-bar))
      color: rgb(var(--v-theme-on-app-bar))

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
