<template>
  <div id="bubbles">
    <div v-for="(bubble, i) in bubbles" :key="i" class="bubble">
      <btn :icon="bubble.icon" @click="toggle(bubble)" :class="{ open: bubble.open }" />
      <component class="content" v-show="bubble.open" :is="bubble.component" :data="bubble.componentData" />
    </div>
  </div>
</template>

<script>
import { markRaw, ref } from 'vue'
import { emitter } from '../../utils'

const DEFAULT_CONFIG = {
  open: true
}

export default {
  name: 'Bubbles',
  setup () {
    const bubbles = ref([])

    emitter.on('bubble_open', data => {
      data.component = markRaw(data.component)
      bubbles.value.push(
        Object.assign({}, DEFAULT_CONFIG, data)
      )
    })

    emitter.on('bubble_close', uri => {
      const index = bubbles.value.findIndex(b => b.uri === uri)
      if (index !== -1) bubbles.value.splice(index, 1)
    })

    function toggle (bubble) {
      bubble.open = !bubble.open
    }

    return {
      bubbles,
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
          color: #ff6
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
</style>
