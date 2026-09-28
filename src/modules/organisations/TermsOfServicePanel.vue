<script setup lang="ts">
import { DateTime } from 'luxon'
import { computed, onBeforeMount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import Richtext from '@/components/Richtext.vue'
import RichtextEditor from '@/components/RichtextEditor.vue'
import type { EditorComponent } from '@/components/types'
import useErrorHandler from '@/composables/useErrorHandler'
import { dialogQuery, stripHTML } from '@/utils'
import { ThemeColor } from '@/utils/types'

import TosText from './TosText.vue'
import useTermsOfService, { isScheduled } from './useTermsOfService'

const { t } = useI18n()
const { handled } = useErrorHandler({ target: 'dialog' })
const { active, needsReview, newest, versions, fetchTos, saveTos } =
  useTermsOfService()

const fetchFailed = ref(false)
const body = ref(newest.value?.body ?? '')
const editor = ref<EditorComponent | null>(null)
const correction = ref(false)
const saving = ref(false)

function formatDate(iso: string) {
  return DateTime.fromISO(iso).toLocaleString(DateTime.DATE_FULL)
}

function reset() {
  body.value = newest.value?.body ?? ''
  // The editor only reads its value when mounted
  editor.value?.setText(body.value)
  correction.value = false
}

// Without a version there's nothing to correct
watch(newest, (tos) => {
  if (!tos) correction.value = false
})

// The addition is optional, and an emptied editor still holds some markup
const cleanBody = computed(() => (stripHTML(body.value) ? body.value : ''))
const canSave = computed(() => cleanBody.value !== (newest.value?.body ?? ''))

async function save() {
  if (
    !correction.value &&
    !(await dialogQuery({
      title: t('organization.tos.confirmPublish'),
      theme: ThemeColor.Warning
    }))
  )
    return
  saving.value = true
  await handled(async () => {
    await saveTos(cleanBody.value, correction.value)
    reset()
  })
  saving.value = false
}

async function load() {
  fetchFailed.value = false
  try {
    await fetchTos()
    reset()
  } catch {
    fetchFailed.value = true
  }
}

onBeforeMount(load)
</script>

<template>
  <div v-if="fetchFailed" class="text-center">
    <p class="my-4 text-warning">{{ $t('organization.tos.fetchFailed') }}</p>
    <v-btn
      color="primary"
      prepend-icon="mdi-autorenew"
      :text="$t('tryAgain')"
      @click="load"
    />
  </div>
  <div v-else-if="versions">
    <v-alert
      v-if="needsReview"
      class="mb-4"
      :text="$t('organization.tos.needsReviewText')"
      :title="$t('organization.tos.needsReview')"
      type="warning"
    />
    <v-alert
      v-else-if="!newest"
      class="mb-4"
      :text="$t('organization.tos.noTos')"
      type="info"
    />

    <v-expansion-panels v-if="newest" class="mb-6">
      <v-expansion-panel :title="$t('organization.tos.standardTerms')">
        <v-expansion-panel-text>
          <Richtext :value="newest.global_body" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-form @submit.prevent="save">
      <p class="mb-2">{{ $t('organization.tos.bodyHelp') }}</p>
      <RichtextEditor ref="editor" variant="full" v-model="body" />
      <v-checkbox
        v-if="newest"
        :hint="
          $t('organization.tos.correctionHint', {
            date: formatDate(newest.version)
          })
        "
        :label="$t('organization.tos.correction')"
        persistent-hint
        v-model="correction"
      />
      <v-expand-transition>
        <div v-if="correction">
          <v-alert
            class="my-3"
            :text="$t('organization.tos.correctionWarning')"
            :title="$t('organization.tos.correctionWarningTitle')"
            type="warning"
          />
        </div>
      </v-expand-transition>
      <div class="d-flex ga-2 mt-3">
        <v-spacer />
        <v-btn
          :disabled="saving"
          :text="$t('reset')"
          variant="text"
          @click="reset"
        />
        <v-btn
          color="primary"
          :disabled="!canSave"
          :loading="saving"
          :text="
            correction
              ? $t('organization.tos.saveCorrection')
              : $t('organization.tos.publish')
          "
          type="submit"
        />
      </div>
    </v-form>

    <template v-if="versions.length">
      <h2 class="mt-8 mb-4">{{ $t('organization.tos.versions') }}</h2>
      <v-expansion-panels>
        <v-expansion-panel v-for="tos in versions" :key="tos.pk">
          <v-expansion-panel-title>
            <span class="flex-grow-1">{{ formatDate(tos.version) }}</span>
            <v-chip
              v-if="tos.pk === active?.pk"
              class="mr-2"
              color="primary"
              size="small"
              :text="$t('organization.tos.current')"
            />
            <v-chip
              v-else-if="isScheduled(tos)"
              class="mr-2"
              size="small"
              :text="$t('organization.tos.scheduled')"
            />
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <TosText :tos="tos" />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>
  </div>
  <div v-else class="py-8 text-center">
    <v-progress-circular indeterminate color="primary" />
  </div>
</template>
