<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const { back } = window.history.state
const lastRoute: string | undefined =
  typeof back === 'string' && back.startsWith('/') ? back : undefined
</script>

<template>
  <v-btn
    v-if="lastRoute"
    color="primary"
    prepend-icon="mdi-chevron-left"
    :text="$t('navigation.back')"
    :href="lastRoute"
    @click.prevent="router.back"
  />
</template>
