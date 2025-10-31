<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'

import { cols } from '@/utils/defaults'
import restApi from '@/utils/restApi'
import AppBar from '@/components/AppBar.vue'

import { IDjangoMessage } from './types'

const LEVEL_ICONS = {
  debug: 'mdi-bug',
  error: 'mdi-alert-decagram',
  info: 'mdi-information',
  success: 'mdi-check',
  warning: 'mdi-alert'
} as const

const router = useRouter()

const messages = ref<IDjangoMessage[]>()

async function fetchMessages() {
  try {
    messages.value = (
      await restApi.get<IDjangoMessage[]>('user/messages/')
    ).data
    if (!messages.value.length) router.push({ name: 'home' })
  } catch {
    alert('Misslyckades med att hämta meddelanden')
  }
}

function messageToProps(msg: IDjangoMessage) {
  return {
    color: msg.level_tag,
    title: msg.message,
    prependIcon: LEVEL_ICONS[msg.level_tag]
  }
}

const annotatedMessages = computed(() => {
  if (!messages.value) return
  return messages.value.map(messageToProps)
})

onBeforeMount(fetchMessages)
</script>

<template>
  <v-main>
    <v-container>
      <AppBar :title="$t('auth.error')" />
      <v-row class="my-6">
        <v-col v-bind="cols.default" class="text-center">
          <h1 class="mb-3">{{ $t('auth.error') }}</h1>
          <div v-if="annotatedMessages === undefined">
            <v-progress-circular indeterminate color="primary" />
          </div>
          <v-list v-else bg-color="transparent" class="text-left mb-6">
            <v-list-item
              v-for="props in annotatedMessages"
              active
              v-bind="props"
            />
          </v-list>
          <div>
            <v-btn
              prepend-icon="mdi-home"
              :text="$t('home.home')"
              color="primary"
              :to="{ name: 'home' }"
            />
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>
