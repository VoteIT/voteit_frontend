<template>
  <transition name="fade">
    <main v-if="!initDone">
      <img src="https://ca.slack-edge.com/T030AG213-U030AG219-f63b38b74163-512" class="anders" />
      <img src="@/assets/voteit-logo.svg" class="logo" />
      <h1 v-if="initFailed">No loot!</h1>
      <h1 v-else>Looting{{ dots }}</h1>
    </main>
  </transition>
</template>

<script>
import useLoader from '@/composables/useLoader.js'

let timer

export default {
  name: 'Loader',
  setup () {
    return useLoader('Loader')
  },
  data () {
    return {
      dotCount: 0
    }
  },
  methods: {
    dotUp () {
      this.dotCount++
      if (this.dotCount > 3) {
        this.dotCount = 0
      }
    }
  },
  computed: {
    dots () {
      return '.'.repeat(this.dotCount)
    }
  },
  mounted () {
    timer = setInterval(this.dotUp, 250)
  },
  unmounted () {
    clearInterval(timer)
  }
}
</script>

<style lang="sass" scoped>
@keyframes shake
  10%,
  90%
    transform: translate3d(-1px, 0, 0) rotate(1deg)

  20%,
  80%
    transform: translate3d(2px, 0, 0)

  30%,
  50%,
  70%
    transform: translate3d(-4px, 0, 0)

  40%,
  60%
    transform: translate3d(4px, 0, 0)

main
  position: fixed
  top: 0
  left: 0
  width: 100vw
  height: 100vh
  background-color: #fff

.fade-leave-active
  transition: opacity 0.5s ease

.fade-leave-to
  opacity: 0

img.anders
  position: fixed
  left: 0
  bottom: 0
  height: auto
  width: 30vw

img.logo
  position: fixed
  left: 11.5vw
  bottom: 20vw
  width: 7vw
  height: auto
  filter: invert(1)
  opacity: .5
  animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both infinite

h1
  position: fixed
  left: 26vw
  bottom: 12vw
  font-size: 4vw
</style>
