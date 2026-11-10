<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import ConfirmPhraseDialog from '@/components/ConfirmPhraseDialog.vue'
import useOrgStore from '@/modules/organisations/useOrgStore'

import useAuthStore from './useAuthStore'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const orgStore = useOrgStore()

const phrase = computed(
  () => authStore.user?.userid || t('auth.removal.confirmWord')
)

async function requestRemoval() {
  await authStore.setRemovalRequested(true)
  // The removal gate would get there too, but this says what happens next
  await router.push({ name: 'auth:abortRemoval' })
}
</script>

<template>
  <v-card prepend-icon="mdi-account-remove" :title="$t('auth.removal.title')">
    <template #text>
      <p class="mb-2">
        {{ $t('auth.removal.intro', { title: orgStore.organisation?.title }) }}
      </p>
      <ul class="ml-4">
        <li>{{ $t('auth.removal.step1') }}</li>
        <li>{{ $t('auth.removal.step2') }}</li>
        <li>{{ $t('auth.removal.step3') }}</li>
      </ul>
    </template>
    <template #actions>
      <v-spacer />
      <ConfirmPhraseDialog
        color="error"
        :confirm="requestRemoval"
        :confirm-text="$t('auth.removal.confirmTitle')"
        :phrase="phrase"
        :text="$t('auth.removal.confirmText')"
        :title="$t('auth.removal.confirmTitle')"
      >
        <template #activator="{ props }">
          <v-btn
            color="error"
            prepend-icon="mdi-account-remove"
            :text="$t('auth.removal.confirmTitle')"
            variant="tonal"
            v-bind="props"
          />
        </template>
      </ConfirmPhraseDialog>
    </template>
  </v-card>
</template>
