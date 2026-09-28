<script setup lang="ts">
import { DateTime } from 'luxon'
import { computed, onBeforeMount, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { cols } from '@/utils/defaults'
import AppBar from '@/components/AppBar.vue'
import TosText from '@/modules/organisations/TosText.vue'
import { listTos } from '@/modules/organisations/tosApi'
import type { TermsOfService } from '@/modules/organisations/types'
import useOrgStore from '@/modules/organisations/useOrgStore'

import { getAcceptTosResume } from './acceptTos'

const { t } = useI18n()
const route = useRoute()
const orgStore = useOrgStore()

const resume = computed(() => getAcceptTosResume(route.query))

const tos = shallowRef<TermsOfService>()
const error = shallowRef<'missing' | 'failed'>()
const errorText = computed(() => {
  switch (error.value) {
    case 'missing':
      return t('auth.acceptTos.error.missing')
    case 'failed':
      return t('auth.acceptTos.error.failed')
  }
})
const answering = shallowRef(false)

const version = computed(
  () =>
    tos.value &&
    DateTime.fromISO(tos.value.version).toLocaleString(DateTime.DATE_FULL)
)

async function fetchTos() {
  if (!resume.value) {
    error.value = 'missing'
    return
  }
  try {
    // No session while the login is paused, so this is the active version only
    tos.value = (await listTos())[0]
    if (!tos.value) error.value = 'failed'
  } catch {
    error.value = 'failed'
  }
}

/**
 * Hand the answer back to the login that's waiting on it.
 *
 * A full page load, not a fetch: the pipeline resumes in the session the
 * partial belongs to and finishes by redirecting into the app.
 */
function accept() {
  if (!tos.value || !resume.value) return
  answering.value = true
  location.assign(resume.value(tos.value.pk))
}

onBeforeMount(fetchTos)
</script>

<template>
  <v-main>
    <v-container>
      <AppBar :title="$t('auth.acceptTos.title')" />
      <v-row class="my-6">
        <v-col v-bind="cols.default">
          <h1 class="mb-3">{{ $t('auth.acceptTos.title') }}</h1>
          <template v-if="error">
            <v-alert class="mb-6" :text="errorText" type="error" />
            <v-btn
              color="primary"
              prepend-icon="mdi-home"
              :text="$t('home.home')"
              :to="{ name: 'home' }"
            />
          </template>
          <template v-else-if="tos">
            <p class="mb-2">
              {{
                $t('auth.acceptTos.help', {
                  title: orgStore.organisation?.title
                })
              }}
            </p>
            <p class="mb-6 text-medium-emphasis">
              {{ $t('auth.acceptTos.version', { date: version }) }}
            </p>
            <v-sheet border class="mb-6 pa-4" rounded>
              <TosText :tos="tos" />
            </v-sheet>
            <div class="d-flex ga-1 flex-wrap justify-end">
              <v-btn
                :disabled="answering"
                :text="$t('auth.acceptTos.cancel')"
                :to="{ name: 'home' }"
                variant="text"
              />
              <v-btn
                color="primary"
                :loading="answering"
                :text="$t('auth.acceptTos.accept')"
                @click="accept"
              />
            </div>
          </template>
          <div v-else class="text-center">
            <v-progress-circular color="primary" indeterminate />
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>
