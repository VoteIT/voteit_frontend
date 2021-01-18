<template>
  <div id="bubbles">
    <div v-for="{ component, data } in bubbles" :key="component.name" class="bubble">
      <btn :icon="component.icon" @click="toggle(component)" :class="{ open: component.name === openBubble }" />
      <transition name="bubble-content">
        <component class="content" v-show="component.name === openBubble" :is="component" :data="data" />
      </transition>
    </div>
  </div>
</template>

<script>
import { markRaw, nextTick, ref } from 'vue'
import { emitter } from '../../utils'
import Chat from './bubbles/Chat'

const DEFAULT_CONFIG = {
  open: true
}

export default {
  name: 'Bubbles',
  setup () {
    const bubbles = ref([{
      component: markRaw(Chat),
      data: {}
    }])
    const openBubble = ref(null)

    emitter.on('bubble_activate', ({ component, data, config }) => {
      config = Object.assign({}, DEFAULT_CONFIG, config)
      const bubble = bubbles.value.find(b => b.component === component)
      if (!bubble) {
        bubbles.value.push({
          component: markRaw(component),
          data
        })
      }
      if (config.open) {
        nextTick(_ => { openBubble.value = component.name })
      }
    })

    emitter.on('bubble_remove', component => {
      const index = bubbles.value.findIndex(b => b.component === component)
      if (index !== -1) bubbles.value.splice(index, 1)
    })

    emitter.on('bubble_open', component => {
      openBubble.value = component.name
    })

    emitter.on('bubble_close', component => {
      if (!name || bubbles.value.find(b => b.component === component)) {
        openBubble.value = null
      }
    })

    function toggle (component) {
      if (openBubble.value === component.name) openBubble.value = null
      else openBubble.value = component.name
    }

    return {
      bubbles,
      openBubble,
      toggle
    }
  }
}
</script>

<style lang="sass">
#bubbles
  position: fixed
  right: 0
  bottom: 0
  padding: 10px
  display: flex
  flex-flow: row-reverse

  .bubble
    position: relative
    > button
      background-color: #000
      .material-icons
        color: #fff
      height: 50px
      width: 50px
      border-radius: 50%
      &:focus
        outline: none
      &.open
        background-color: #333
        .material-icons
          color: #bbf
      margin-left: 10px
      &:first-child
        margin-right: 0
    > .content
      position: absolute
      bottom: 65px
      width: 20vw
      min-width: 300px
      right: 20px
      padding: 1rem
      background-color: #eee
      border-radius: 5px 5px 0 5px
      filter: drop-shadow(1px 1px 2px rgba(#000, .4))
      &::after
        content: ""
        border: 5px solid #eee
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
