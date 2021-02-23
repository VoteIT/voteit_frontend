<template>
  <transition name="fade">
    <main v-if="!initDone">
      <img src="https://ca.slack-edge.com/T030AG213-U030AG219-f63b38b74163-512" class="anders" />
      <img src="@/assets/voteit-logo.svg" class="logo" />
      <h1 v-if="initFailed">{{ t('loader.failed') }}</h1>
      <h1 v-else>{{ t('loader.loading') }}{{ dots }}</h1>
    </main>
  </transition>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from 'vue'

import useLoader from '@/composables/useLoader'

let timer: number

export default defineComponent({
  name: 'Loader',
  inject: ['t'],
  setup () {
    const dotCount = ref(0)
    const loader = useLoader('Loader')

    function dotUp () {
      dotCount.value = (dotCount.value + 1) % 4
    }

    onMounted(() => {
      timer = setInterval(dotUp, 333)
    })

    function doneOrFailed (value: boolean) {
      value && clearInterval(timer)
    }
    watch(loader.initDone, doneOrFailed)
    watch(loader.initFailed, doneOrFailed)

    const dots = computed(() => '.'.repeat(dotCount.value))

    return {
      dotCount,
      dots,
      ...loader
    }
  }
})
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
