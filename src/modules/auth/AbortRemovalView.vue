<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { cols } from '@/utils/defaults'
import { DATETIME_LONG, formatDate } from '@/utils/dates'
import { parseRestError } from '@/utils/restApi'
import AppBar from '@/components/AppBar.vue'
import { profileType } from '@/modules/organisations/contentTypes'

import useAuthStore from './useAuthStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const token = computed(() => {
  const { token } = route.query
  return typeof token === 'string' && token ? token : undefined
})

const requestedDate = computed(
  () =>
    authStore.user?.removal_requested &&
    formatDate(authStore.user.removal_requested, DATETIME_LONG)
)

const working = shallowRef(false)
const error = shallowRef<string>()
/** The server's answer to an aborted removal, by token */
const doneMessage = shallowRef<string>()

async function run(fn: () => Promise<void>) {
  working.value = true
  error.value = undefined
  try {
    await fn()
  } catch (e) {
    error.value = Object.values(parseRestError(e)).flat().join(' ')
  }
  working.value = false
}

/** Signed in, the session is enough. */
function abortSignedIn() {
  return run(async () => {
    await authStore.setRemovalRequested(false)
    await router.replace({ name: 'profile' })
  })
}

/**
 * From the email link, or a login stopped by the request: there may be no
 * session, so the token stands in for one. Only on click - mail scanners open
 * links.
 */
function abortWithToken() {
  if (!token.value) return
  const t = token.value
  return run(async () => {
    const { message } = await profileType.api.listAction<{ message: string }>(
      'abort-removal',
      { token: t }
    )
    doneMessage.value = message
    if (authStore.isAuthenticated) await authStore.fetchAuthenticatedUser()
  })
}
</script>

<template>
  <v-main>
    <v-container>
      <AppBar :title="$t('auth.abortRemoval.title')" />
      <v-row class="my-6">
        <v-col v-bind="cols.default">
          <h1 class="mb-3">{{ $t('auth.abortRemoval.title') }}</h1>
          <template v-if="authStore.hasRequestedRemoval">
            <v-alert
              class="mb-4"
              icon="mdi-account-remove"
              :text="$t('auth.abortRemoval.help')"
              :title="$t('auth.abortRemoval.pending', { date: requestedDate })"
              type="warning"
            />
            <v-alert v-if="error" class="mb-4" :text="error" type="error" />
            <div class="d-flex justify-end">
              <v-btn
                color="primary"
                :loading="working"
                prepend-icon="mdi-undo-variant"
                :text="$t('auth.abortRemoval.abort')"
                @click="abortSignedIn"
              />
            </div>
          </template>
          <template v-else-if="doneMessage">
            <v-alert class="mb-4" :text="doneMessage" type="success" />
            <v-btn
              color="primary"
              prepend-icon="mdi-home"
              :text="$t('home.home')"
              :to="{ name: 'home' }"
            />
          </template>
          <template v-else-if="token">
            <p class="mb-4">{{ $t('auth.abortRemoval.tokenHelp') }}</p>
            <v-alert v-if="error" class="mb-4" :text="error" type="error" />
            <div class="d-flex ga-1 flex-wrap justify-end">
              <v-btn
                :disabled="working"
                :text="$t('home.home')"
                :to="{ name: 'home' }"
                variant="text"
              />
              <v-btn
                color="primary"
                :loading="working"
                prepend-icon="mdi-undo-variant"
                :text="$t('auth.abortRemoval.abort')"
                @click="abortWithToken"
              />
            </div>
          </template>
          <template v-else>
            <v-alert
              class="mb-4"
              :text="$t('auth.abortRemoval.nonePending')"
              type="info"
            />
            <v-btn
              color="primary"
              prepend-icon="mdi-home"
              :text="$t('home.home')"
              :to="{ name: 'home' }"
            />
          </template>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>
