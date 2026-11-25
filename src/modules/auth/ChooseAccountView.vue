<script setup lang="ts">
import { computed, onBeforeMount, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { dialogQuery } from '@/utils'
import { cols } from '@/utils/defaults'
import restApi, { isApiError } from '@/utils/restApi'
import { ThemeColor } from '@/utils/types'
import AppBar from '@/components/AppBar.vue'
import Moment from '@/components/Moment.vue'

import { ChooseAccountAnswer, getChooseAccountResume } from './chooseAccount'
import AccountMeetingList from './AccountMeetingList.vue'
import { IdentityAccountOptions } from './types'

const { t } = useI18n()
const route = useRoute()

const token = computed(() => {
  const value = route.query.partial_token
  return typeof value === 'string' ? value : undefined
})
/** The server sends us back here when it couldn't merge after all. */
const mergeRefused = computed(() => route.query.merge_refused === '1')

const options = shallowRef<IdentityAccountOptions>()
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
    options.value = await restApi.get<IdentityAccountOptions>(
      'identity-account-options/',
      { params: { partial_token: token.value } }
    )
  } catch (e) {
    error.value = isApiError(e) && e.status === 404 ? 'expired' : 'failed'
  }
}

/**
 * Hand the answer back to the login that's waiting on it. A full page load,
 * since the pipeline resumes in the session the partial belongs to.
 */
function answer(value: ChooseAccountAnswer) {
  const resume = getChooseAccountResume(token.value, options.value?.resume_url)
  if (!resume) {
    error.value = 'failed'
    return
  }
  answering.value = true
  location.assign(resume(value))
}

async function merge() {
  if (
    await dialogQuery({
      title: t('auth.chooseAccount.mergeConfirm'),
      theme: ThemeColor.Warning
    })
  )
    answer('merge')
}

onBeforeMount(fetchOptions)
</script>

<template>
  <v-main>
    <v-container>
      <AppBar :title="$t('auth.chooseAccount.title')" />
      <v-row class="my-6">
        <v-col v-bind="cols.default">
          <h1 class="mb-3">{{ $t('auth.chooseAccount.title') }}</h1>
          <v-alert
            v-if="error"
            class="mb-6"
            :text="errorText"
            :type="error === 'expired' ? 'info' : 'error'"
          />
          <template v-else-if="options">
            <v-alert
              v-if="mergeRefused"
              class="mb-6"
              :text="$t('auth.chooseAccount.mergeRefused')"
              type="warning"
            />
            <p class="mb-6">{{ $t('auth.chooseAccount.description') }}</p>
            <template v-if="options.accounts.length > 1">
              <h2 class="text-h6 mb-2">
                {{ $t('auth.chooseAccount.mergeTitle') }}
              </h2>
              <template v-if="options.can_merge">
                <p class="mb-3">{{ $t('auth.chooseAccount.mergeHelp') }}</p>
                <v-btn
                  color="primary"
                  :disabled="answering"
                  prepend-icon="mdi-merge"
                  :text="$t('auth.chooseAccount.merge')"
                  @click="merge"
                />
              </template>
              <template v-else>
                <p class="mb-2">{{ $t('auth.chooseAccount.mergeBlocked') }}</p>
                <p
                  v-if="options.merge_blocked_reason"
                  class="text-medium-emphasis"
                >
                  {{ options.merge_blocked_reason }}
                </p>
              </template>
              <v-divider class="my-6" />
            </template>
            <v-sheet
              v-for="account in options.accounts"
              :key="account.pk"
              border
              class="mb-3 pa-4 d-flex ga-4 align-center flex-wrap"
              rounded
            >
              <div class="flex-grow-1">
                <h2 class="text-h6">
                  {{ account.name }}
                  <span
                    v-if="account.userid"
                    class="text-body-2 text-medium-emphasis"
                  >
                    {{ account.userid }}
                  </span>
                </h2>
                <p>{{ account.email }}</p>
                <p v-if="account.last_login" class="text-medium-emphasis">
                  {{ $t('auth.linkAccount.lastLogin') }}
                  <Moment :date="account.last_login" ordinary />
                </p>
                <p v-else class="text-medium-emphasis">
                  {{ $t('auth.linkAccount.neverUsed') }}
                </p>
                <AccountMeetingList
                  v-if="account.meetings.length"
                  :meetings="account.meetings"
                />
                <p v-else class="mt-2 text-medium-emphasis">
                  {{ $t('auth.chooseAccount.noMeetings') }}
                </p>
              </div>
              <v-btn
                color="primary"
                :disabled="answering"
                :text="$t('auth.chooseAccount.useThis')"
                @click="answer({ account: account.pk })"
              />
            </v-sheet>
            <v-divider class="my-6" />
            <v-btn
              :disabled="answering"
              :text="$t('auth.linkAccount.cancel')"
              :to="{ name: 'home' }"
              variant="text"
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
