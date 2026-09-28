<script setup lang="ts">
import { DateTime } from 'luxon'
import { computed, onBeforeMount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import DefaultDialog from '@/components/DefaultDialog.vue'
import Richtext from '@/components/Richtext.vue'
import RichtextEditor from '@/components/RichtextEditor.vue'
import useErrorHandler from '@/composables/useErrorHandler'
import { dialogQuery, stripHTML } from '@/utils'
import { ThemeColor } from '@/utils/types'

import useTermsOfService from './useTermsOfService'

const { t } = useI18n()
const { handled } = useErrorHandler({ target: 'dialog' })
const {
  current,
  globalVersions,
  needsReview,
  newerGlobalVersions,
  organisationTos,
  fetchCurrent,
  fetchGlobalVersions,
  saveTos
} = useTermsOfService()

const fetchFailed = ref(false)
const editing = ref(false)
const body = ref('')
const correction = ref(false)
const saving = ref(false)

/** The global versions are only needed to review our terms against. */
const loaded = computed(
  () => current.value && (!needsReview.value || globalVersions.value)
)

/** Newest published, which is what to review our terms against. */
const globalTos = computed(
  () => globalVersions.value?.[0] ?? current.value?.global_tos
)

function formatDate(iso: string) {
  return DateTime.fromISO(iso).toLocaleString(DateTime.DATE_FULL)
}

function startEditing() {
  body.value = organisationTos.value?.body ?? ''
  correction.value = false
  editing.value = true
}

// The addition is optional, and an emptied editor still holds some markup
const cleanBody = computed(() => (stripHTML(body.value) ? body.value : ''))
const canSave = computed(() =>
  organisationTos.value
    ? cleanBody.value !== organisationTos.value.body
    : !!cleanBody.value
)

async function publish(body: string, correction = false) {
  if (
    !correction &&
    !(await dialogQuery({
      title: t('organization.tos.confirmPublish'),
      theme: ThemeColor.Warning
    }))
  )
    return
  saving.value = true
  await handled(async () => {
    await saveTos(body, correction)
    editing.value = false
  })
  saving.value = false
}

/** Roll out the new global terms with our terms as they are. */
function acceptUnchanged() {
  if (organisationTos.value) publish(organisationTos.value.body)
}

async function load() {
  fetchFailed.value = false
  editing.value = false
  try {
    await fetchCurrent()
    if (needsReview.value) await fetchGlobalVersions()
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
  <div v-else-if="loaded">
    <v-alert
      v-if="needsReview"
      class="mb-4"
      :text="$t('organization.tos.needsReviewText')"
      :title="$t('organization.tos.needsReview')"
      type="warning"
    />

    <h2 class="mb-2">{{ $t('organization.tos.standardTerms') }}</h2>
    <template v-if="globalTos">
      <p class="mb-2 text-medium-emphasis">
        {{
          $t('organization.tos.published', {
            date: formatDate(globalTos.version)
          })
        }}
      </p>
      <v-sheet border class="mb-6 pa-4" rounded>
        <Richtext :value="globalTos.body" />
      </v-sheet>
    </template>
    <p v-else class="mb-6 text-medium-emphasis">
      {{ $t('organization.tos.noStandardTerms') }}
    </p>

    <template v-if="needsReview && newerGlobalVersions.length">
      <v-expansion-panels class="mb-6">
        <v-expansion-panel :title="$t('organization.tos.globalChanges')">
          <v-expansion-panel-text>
            <v-list bg-color="transparent">
              <v-list-item
                v-for="g in newerGlobalVersions"
                :key="g.pk"
                :title="formatDate(g.version)"
              >
                <template #append>
                  <DefaultDialog
                    :title="
                      $t('organization.tos.notesTitle', {
                        date: formatDate(g.version)
                      })
                    "
                  >
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        :prepend-icon="g.notes ? 'mdi-text-box' : undefined"
                        size="small"
                        :text="$t('organization.tos.details')"
                        variant="tonal"
                      />
                    </template>
                    <v-alert
                      v-if="g.notes"
                      class="mb-4"
                      icon="mdi-text-box"
                      :title="$t('organization.tos.changeNotes')"
                    >
                      <Richtext :value="g.notes" />
                    </v-alert>
                    <Richtext :value="g.body" />
                  </DefaultDialog>
                </template>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>

    <template v-if="organisationTos">
      <h2 class="mb-2">{{ $t('organization.tos.organisationTerms') }}</h2>
      <p class="mb-2 text-medium-emphasis">
        {{
          $t('organization.tos.published', {
            date: formatDate(organisationTos.version)
          })
        }}
      </p>
      <v-sheet v-if="!editing" border class="mb-4 pa-4" rounded>
        <Richtext v-if="organisationTos.body" :value="organisationTos.body" />
        <p v-else class="text-medium-emphasis">
          {{ $t('organization.tos.emptyBody') }}
        </p>
      </v-sheet>
    </template>
    <v-alert
      v-else-if="!editing"
      class="mb-4"
      :text="$t('organization.tos.noTos')"
      type="info"
    />

    <div v-if="!editing" class="d-flex ga-2 flex-wrap justify-end">
      <v-btn
        v-if="needsReview"
        :loading="saving"
        :text="$t('organization.tos.acceptUnchanged')"
        variant="tonal"
        @click="acceptUnchanged"
      />
      <v-btn
        color="primary"
        :disabled="saving"
        :prepend-icon="organisationTos ? 'mdi-pencil' : 'mdi-plus'"
        :text="
          organisationTos
            ? $t('organization.tos.edit')
            : $t('organization.tos.add')
        "
        @click="startEditing"
      />
    </div>

    <v-form v-else @submit.prevent="publish(cleanBody, correction)">
      <p class="mb-2">{{ $t('organization.tos.bodyHelp') }}</p>
      <RichtextEditor variant="full" v-model="body" />
      <!-- A correction keeps the date, so it can't settle a review -->
      <template v-if="organisationTos && !needsReview">
        <v-checkbox
          :hint="
            $t('organization.tos.correctionHint', {
              date: formatDate(organisationTos.version)
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
      </template>
      <div class="d-flex ga-2 mt-3">
        <v-spacer />
        <v-btn
          :disabled="saving"
          :text="$t('cancel')"
          variant="text"
          @click="editing = false"
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
  </div>
  <v-progress-linear v-else color="primary" indeterminate />
</template>
