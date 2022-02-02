<template>
  <div style="height: 64px" />
  <div id="bubbles">
    <div v-for="{ component, data } in bubbles" :key="component.name" class="bubble">
      <v-btn :icon="component.icon" @click="toggle(component)" :class="{ open: component.name === openBubble }" />
      <transition name="bubble-content">
        <component class="content" v-show="component.id === openBubble" :is="component" :data="data" @close="toggle(component)" />
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, markRaw, nextTick, reactive, ref } from 'vue'

// import Chat from '@/components/meeting/bubbles/Chat.vue'
import { BubbleComponent, BubbleConfig, BubbleInfo } from './types'
import { activateBubbleEvent, openBubbleEvent, closeBubbleEvent, removeBubbleEvent } from './events'

const DEFAULT_CONFIG: BubbleConfig = {
  open: true
}

export default defineComponent({
  setup () {
    const bubbles = reactive<BubbleInfo[]>([])
    // const bubbles = ref<BubbleInfo[]>([{
    //   component: markRaw(Chat as BubbleComponent),
    //   data: {}
    // }])
    const openBubble = ref<string | null>(null)

    activateBubbleEvent.on(evt => {
      const config = { ...DEFAULT_CONFIG, ...evt.config }
      const bubble = bubbles.find(b => b.component === evt.component)
      if (!bubble) {
        bubbles.push({
          component: markRaw(evt.component),
          data: evt.data
        })
      }
      if (config.open) {
        nextTick(() => { openBubble.value = evt.component.id })
      }
    })

    removeBubbleEvent.on(component => {
      const index = bubbles.findIndex(b => b.component === component)
      if (index !== -1) bubbles.splice(index, 1)
    })

    openBubbleEvent.on(component => {
      openBubble.value = component.id
    })

    closeBubbleEvent.on(component => {
      if (bubbles.find(b => b.component === component)) {
        openBubble.value = null
      }
    })

    function toggle (component: BubbleComponent) {
      if (openBubble.value === component.id) openBubble.value = null
      else openBubble.value = component.id
    }

    return {
      bubbles,
      openBubble,
      toggle
    }
  }
})
</script>

<style lang="sass">
#bubbles
  position: fixed
  z-index: 3
  right: 0
  bottom: 0
  padding: 10px
  display: flex
  flex-flow: row-reverse

  .bubble
    position: relative
    > button
      background-color: rgb(var(--v-theme-surface))
      border: 1px solid rgba(var(--v-theme-on-surface), .4)
      color: rgb(var(--v-theme-on-surface))
      height: 64px
      width: 64px
      border-radius: 50%
      &:focus
        outline: none
      &.open
        background-color: rgb(var(--v-theme-on-surface))
        color: rgb(var(--v-theme-surface))

    margin-left: 10px
    &:last-child
      margin-left: 0
    > .content
      position: absolute
      bottom: 75px
      width: 20vw
      min-width: 300px
      right: 32px
      padding: 1rem
      background-color: rgb(var(--v-theme-surface))
      border-radius: 5px 5px 0 5px
      filter: drop-shadow(1px 1px 2px rgba(#000, .4))
      &::after
        content: ""
        border: 5px solid rgb(var(--v-theme-surface))
        border-bottom: 5px solid transparent
        border-left: 5px solid transparent
        position: absolute
        width: 0
        height: 0
        right: 0
        bottom: -10px
      h2
        margin-top: 0

.bubble-content-enter-active,
.bubble-content-leave-active
  transition: opacity .2s ease, transform .3s ease

.bubble-content-enter-from
  opacity: 0
  transform: rotate(-2deg) scale(.6) translate(20%)
.bubble-content-leave-to
  opacity: 0
  transform: rotate(2deg) scale(1.4) translate(-20%)
</style>
