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
      >
        {{ $t('home.home') }}
      </v-btn>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTitle } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

import useOrganisation from '@/modules/organisations/useOrganisation'

const { t } = useI18n()
const { organisation } = useOrganisation()

useTitle(
  computed(() => {
    if (organisation.value)
      return `${t('pageNotFound')} | ${organisation.value.title}`
    return t('pageNotFound')
  })
)
</script>
