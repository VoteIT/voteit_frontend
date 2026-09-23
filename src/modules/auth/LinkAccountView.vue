<script setup lang="ts">
import { computed, onBeforeMount, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { cols } from '@/utils/defaults'
import restApi, { isApiError } from '@/utils/restApi'
import AppBar from '@/components/AppBar.vue'
import Moment from '@/components/Moment.vue'
import useOrgStore from '@/modules/organisations/useOrgStore'

import { AccountLinkOptions, LINK_ACCOUNT_NEW } from './types'

const { t } = useI18n()
const route = useRoute()
const orgStore = useOrgStore()

const token = computed(() => {
  const value = route.query.partial_token
  return typeof value === 'string' ? value : undefined
})

const options = shallowRef<AccountLinkOptions>()
// The backend names the provider, not the service. The organisation knows
// what it's called, and it's fetched at boot whether or not anyone is signed in.
const providerTitle = computed(() => {
  const id = options.value?.provider
  return orgStore.providers.find((p) => p.provider_id === id)?.title ?? id ?? ''
})
const error = shallowRef<'missing' | 'expired' | 'failed'>()
const errorText = computed(() => {
  switch (error.value) {
    case 'missing':
      return t('auth.linkAccount.error.missing')
    case 'expired':
      return t('auth.linkAccount.error.expired')
    case 'failed':
      return t('auth.linkAccount.error.failed')
  }
})
const answering = shallowRef(false)

async function fetchOptions() {
  if (!token.value) {
    error.value = 'missing'
    return
  }
  try {
    options.value = await restApi.get<AccountLinkOptions>(
      'account-link-options/',
      { params: { partial_token: token.value } }
    )
  } catch (e) {
    // 404 is a token that's been spent or swept up, which is the one case
    // worth wording as something other than a failure.
    error.value = isApiError(e) && e.status === 404 ? 'expired' : 'failed'
  }
}

/**
 * Hand the answer back to the login that's waiting on it.
 *
 * A full page load, not a fetch: the pipeline resumes in the session the
 * partial belongs to and finishes by redirecting into the app.
 */
function answer(linkAccount: number | typeof LINK_ACCOUNT_NEW) {
  if (!options.value || !token.value) return
  answering.value = true
  const params = new URLSearchParams({
    partial_token: token.value,
    link_account: String(linkAccount)
  })
  location.assign(`${options.value.resume_url}?${params}`)
}

onBeforeMount(fetchOptions)
</script>

<template>
  <v-main>
    <v-container>
      <AppBar :title="$t('auth.linkAccount.title')" />
      <v-row class="my-6">
        <v-col v-bind="cols.default">
          <h1 class="mb-3">{{ $t('auth.linkAccount.title') }}</h1>
          <v-alert
            v-if="error"
            class="mb-6"
            :text="errorText"
            :type="error === 'expired' ? 'info' : 'error'"
          />
          <template v-else-if="options">
            <p class="mb-6">
              {{
                $t('auth.linkAccount.description', { provider: providerTitle })
              }}
            </p>
            <v-list bg-color="transparent" class="mb-6 pa-0">
              <v-sheet
                v-for="account in options.accounts"
                :key="account.pk"
                border
                class="mb-3 pa-4 d-flex ga-4 align-center flex-wrap"
                rounded
              >
                <div class="flex-grow-1">
                  <h2 class="text-h6">{{ account.name }}</h2>
                  <p>{{ account.email }}</p>
                  <p v-if="account.last_login" class="text-medium-emphasis">
                    {{ $t('auth.linkAccount.lastLogin') }}
                    <Moment :date="account.last_login" ordinary />
                  </p>
                  <p v-else class="text-medium-emphasis">
                    {{ $t('auth.linkAccount.neverUsed') }}
                  </p>
                  <p v-if="account.meetings.length" class="mt-2">
                    <span class="text-medium-emphasis">
                      {{ $t('auth.linkAccount.meetings') }}
                    </span>
                    {{ account.meetings.join(', ') }}
                  </p>
                </div>
                <v-btn
                  color="primary"
                  :disabled="answering"
                  :text="$t('auth.linkAccount.thisIsMine')"
                  @click="answer(account.pk)"
                />
              </v-sheet>
            </v-list>
            <v-divider class="mb-6" />
            <p class="mb-3">{{ $t('auth.linkAccount.noneOfTheseHelp') }}</p>
            <v-btn
              :disabled="answering"
              :text="$t('auth.linkAccount.noneOfThese')"
              variant="tonal"
              @click="answer(LINK_ACCOUNT_NEW)"
            />
          </template>
          <div v-else class="text-center">
            <v-progress-circular color="primary" indeterminate />
          </div>
          <div v-if="error" class="mt-6">
            <v-btn
              color="primary"
              prepend-icon="mdi-home"
              :text="$t('home.home')"
              :to="{ name: 'home' }"
            />
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>
