<template>
  <transition name="fade">
    <main v-if="visible" :class="{ initFailed, initDone }">
      <img :src="require('@/assets/voteit-logo.svg').default" class="logo" />
      <transition name="fade">
        <h1 v-if="!initDone">{{ message }}</h1>
      </transition>
    </main>
  </transition>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useLoader from '@/composables/useLoader'
import { InitState } from '@/composables/types'

let dotInterval: number
let visibleTimeout: number
const DOT_INTERVAL = 333

export default defineComponent({
  name: 'Loader',
  setup () {
    const { t } = useI18n()
    const dotCount = ref(0)
    const { initDone, initFailed, initState } = useLoader('Loader')
    const visible = ref(true)

    function dotUp () {
      dotCount.value = (dotCount.value + 1) % 4
    }

    onMounted(() => {
      dotInterval = setInterval(dotUp, DOT_INTERVAL)
    })

    watch(initState, state => {
      switch (state) {
        case InitState.Done:
          clearInterval(dotInterval)
          visibleTimeout = setTimeout(() => { visible.value = false }, 500)
          break
        case InitState.Failed:
          clearInterval(dotInterval)
          break
        case InitState.Loading:
          clearTimeout(visibleTimeout)
          visible.value = true
          dotInterval = setInterval(dotUp, DOT_INTERVAL)
          break
      }
    })

    const dots = computed(() => '.'.repeat(dotCount.value))
    const message = computed(() => {
      if (initState.value === InitState.Failed) return t('loader.failed')
      return t('loader.loading') + dots.value
    })

    return {
      t,
      initFailed,
      initDone,
      message,
      visible
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

  50%
    transform: translate3d(-4px, 0, 0) rotate(-1deg)

  40%,
  60%
    transform: translate3d(4px, 0, 0)

main
  position: fixed
  top: 0
  left: 0
  bottom: 0
  right: 0
  background-color: rgb(var(--v-theme-app-bar))
  transition: background-color 1s ease-in
  z-index: 1010
  &.initFailed
    background-color: #303030

.fade-leave-active
  transition: opacity 0.5s ease

.fade-leave-to
  opacity: 0

img.logo
  position: fixed
  width: auto
  height: 10vh
  top: 35vh
  left: calc(50vw - 14.5vh)
  transition: height 700ms, left 500ms, top 500ms, transform 1s ease-in
  .initDone &
    height: 21.797px
    left: 31px
    top: 23px
  .initFailed &
    transform: rotate(6deg)

h1
  position: fixed
  color: rgb(var(--v-theme-on-app-bar))
  position: fixed
  left: calc(50vw - 12vh)
  top: 44vh
  font-size: 1.6vh
</style>
