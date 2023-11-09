<template>
  <v-row>
    <v-col class="text-center mt-16">
      <h1 class="mb-2">
        {{ t('pageNotFound') }}
      </h1>
      <p class="mb-8 text-secondary">
        {{ t('pageNotFoundDescription') }}
      </p>
      <v-btn
        size="large"
        :to="{ name: 'home' }"
        color="primary"
        prepend-icon="mdi-home"
      >
        {{ t('home.home') }}
      </v-btn>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useTitle } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

import useOrganisation from '@/modules/organisations/useOrganisation'

const { organisation } = useOrganisation()

export default defineComponent({
  setup() {
    const { t } = useI18n()
    useTitle(
      computed(() => {
        if (organisation.value)
          return `${t('pageNotFound')} | ${organisation.value.title}`
        return t('pageNotFound')
      })
    )

    return { t }
  }
})
</script>
