<script setup lang="ts">
import { computed, onUnmounted, shallowRef, watch } from 'vue'

import useNavigationProgress from '@/loader'

/**
 * A navigation waits for its data before anything is mounted, so the page the
 * user is leaving stays put with no sign that anything is happening. This is
 * that sign. Held back briefly, so a navigation that resolves at once doesn't
 * flash a bar on the way.
 */
const SHOW_DELAY = 150

const { appLoaded, pendingRoute, progress } = useNavigationProgress()

// Nothing to announce during boot - the splash is covering the whole app.
const loading = computed(
  () => appLoaded.value && !!pendingRoute.value && progress.value.total > 0
)

const show = shallowRef(false)
let timer: NodeJS.Timeout

watch(loading, (value) => {
  clearTimeout(timer)
  if (!value) return (show.value = false)
  timer = setTimeout(() => (show.value = true), SHOW_DELAY)
})

onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <v-fade-transition>
    <div v-if="show" class="navigation-progress d-print-none">
      <v-progress-linear color="white" height="4" indeterminate />
    </div>
  </v-fade-transition>
</template>

<style lang="sass" scoped>
.navigation-progress
  position: fixed
  top: 0
  left: 0
  right: 0
  z-index: 1009
</style>
