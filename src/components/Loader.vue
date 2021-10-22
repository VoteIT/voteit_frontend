<template>
  <transition name="fade">
    <main v-if="visible" :class="{ initFailed, initDone, mobile }">
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
import { useDisplay } from 'vuetify/composables'

import useLoader from '@/composables/useLoader'

let timer: number

export default defineComponent({
  name: 'Loader',
  setup () {
    const { t } = useI18n()
    const dotCount = ref(0)
    const { initDone, initFailed } = useLoader('Loader')
    const visible = ref(true)
    const { mobile } = useDisplay()

    function dotUp () {
      dotCount.value = (dotCount.value + 1) % 4
    }

    onMounted(() => {
      timer = setInterval(dotUp, 333)
    })

    watch(initDone, value => {
      if (value) {
        clearInterval(timer)
        setTimeout(() => { visible.value = false }, 500)
      }
    })
    watch(initFailed, value => {
      if (value) clearInterval(timer)
    })

    const dots = computed(() => '.'.repeat(dotCount.value))
    const message = computed(() => initFailed.value ? t('loader.failed') : t('loader.loading') + dots.value)

    return {
      t,
      initDone,
      initFailed,
      message,
      mobile,
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
  z-index: 100

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
    left: 32px
    top: 24px
  .mobile.initDone &
    left: 80px
  .initFailed &
    transform: rotate(6deg)

h1
  position: fixed
  color: rgb(var(--v-theme-on-app-bar))
  position: fixed
  left: calc(50vw - 12vh)
  top: 43vh
  font-size: 2vh
</style>
