<script setup lang="ts">
import useOrgProfile from './useOrgProfile'
import useOrgStore from './useOrgStore'

withDefaults(defineProps<{ width?: number }>(), { width: 320 })

const { logoUrl } = useOrgProfile()
const orgStore = useOrgStore()
</script>

<template>
  <img
    v-if="logoUrl"
    :src="logoUrl"
    :alt="orgStore.organisation?.title"
    class="d-block h-auto"
    :style="{ width: `${width}px`, maxWidth: '100%' }"
  />
</template>
