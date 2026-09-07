<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useNavigationProgress from '@/loader'
import useAppReady from '@/loader/appReady'
import { InitState } from '@/composables/types'

let visibleTimeout: NodeJS.Timeout

const { t } = useI18n()
const { failedMessage } = useAppReady()
const { appLoaded, loadFailed, progress, steps } = useNavigationProgress()

// Up until the first route has what it needs. A blocked navigation mounts
// nothing, so lifting this at the end of the boot fetches alone would uncover
// an empty page.
const initState = computed(() => {
  if (loadFailed.value) return InitState.Failed
  return appLoaded.value ? InitState.Done : InitState.Loading
})
const initFailed = computed(() => initState.value === InitState.Failed)
const initDone = computed(() => initState.value === InitState.Done)
const visible = shallowRef(true)

watch(initState, (state) => {
  switch (state) {
    case InitState.Done:
      visibleTimeout = setTimeout(() => {
        visible.value = false
      }, 500)
      break
    case InitState.Loading:
      clearTimeout(visibleTimeout)
      visible.value = true
      break
  }
})

// The count is cleared the moment the last requirement lands, while this
// message is still on screen fading out - so hold on to it, or the splash
// drops back to a bare "Loading" on its way out. Synchronous, to catch the
// finished count before the clear collapses into the same flush.
const lastSteps = shallowRef<typeof steps.value>()
watch(steps, (value) => value.total && (lastSteps.value = value), {
  flush: 'sync'
})

/**
 * Requirements done out of requirements to do. `steps` counts whole
 * requirements, so it's a number worth reading, but it only has something to
 * say once the route's requirements are under way - the boot fetches before
 * that are not a list anyone declared.
 */
const stepCount = computed(() => {
  if (initFailed.value) return
  return steps.value.total ? steps.value : lastSteps.value
})

const message = computed(() =>
  initFailed.value ? t('loader.failed') : t('loader.loading')
)
</script>

<template>
  <transition name="fade">
    <main v-if="visible" :class="{ initFailed, initDone }">
      <img src="@/assets/voteit-logo.svg" class="logo" />
      <transition name="fade">
        <div v-if="!initDone" class="load-message">
          <h1>
            {{ message }}
            <small v-if="stepCount">
              ({{ stepCount.done }}/{{ stepCount.total }})
            </small>
          </h1>
          <v-progress-linear
            color="white"
            height="1"
            :max="progress.total"
            :model-value="progress.curr"
          />
          <p v-if="failedMessage">
            {{ failedMessage }}
          </p>
        </div>
      </transition>
    </main>
  </transition>
</template>

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
  inset: 0
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

.load-message
  position: fixed
  color: rgb(var(--v-theme-on-app-bar))
  left: calc(50vw - 12vh)
  top: 44vh
  h1
    font-size: 1.6vh
    small
      font-size: .85em
      opacity: .6
  p
    font-style: italic
</style>
