<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const { back } = window.history.state
const lastRoute: string | undefined =
  typeof back === 'string' && back.startsWith('/') ? back : undefined

function goBack() {
  if (lastRoute) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<template>
  <v-btn
    color="primary"
    prepend-icon="mdi-chevron-left"
    :text="lastRoute ? $t('navigation.back') : $t('home.home')"
    :href="lastRoute ?? '/'"
    @click.prevent="goBack"
  />
</template>
