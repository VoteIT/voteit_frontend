<template>
  <v-row>
    <v-col class="text-center mt-16">
      <h1 class="mb-2">
        {{ $t('pageNotFound') }}
      </h1>
      <p class="mb-8 text-secondary">
        {{ $t('pageNotFoundDescription') }}
      </p>
      <v-btn
        size="large"
        :to="{ name: 'home' }"
        color="primary"
        prepend-icon="mdi-home"
        :text="$t('home.home')"
      />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTitle } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

import useOrgStore from '@/modules/organisations/useOrgStore'

const { t } = useI18n()
const orgStore = useOrgStore()

useTitle(
  computed(() => {
    if (orgStore.organisation)
      return `${t('pageNotFound')} | ${orgStore.organisation.title}`
    return t('pageNotFound')
  })
)
</script>
