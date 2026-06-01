<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{ fallback?: string }>()

const router = useRouter()

const { back } = window.history.state
const lastRoute: string | undefined =
  typeof back === 'string' && back.startsWith('/') ? back : undefined

const target = computed(() => lastRoute ?? props.fallback)

function goBack() {
  if (lastRoute) {
    router.back()
  } else if (props.fallback) {
    router.push(props.fallback)
  }
}
</script>

<template>
  <v-btn
    v-if="target"
    color="primary"
    prepend-icon="mdi-chevron-left"
    :text="$t('navigation.back')"
    :href="target"
    @click.prevent="goBack"
  />
</template>
