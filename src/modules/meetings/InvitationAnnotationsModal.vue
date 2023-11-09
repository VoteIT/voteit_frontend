<script setup lang="ts">
import { Dictionary } from 'lodash'
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { parseSocketError } from 'envelope-client'

import { socket } from '@/utils/Socket'
import { Progress } from '@/utils/types'
import useRules from '@/composables/useRules'
import useInviteAnnotations from './useInviteAnnotations'
import useMeeting from './useMeeting'
import { meetingInviteAnnotationPlugins } from './registry'
import DefaultDialog from '@/components/DefaultDialog.vue'

interface AnnotationProgress extends Progress {
  added: number
  changed: number
  existed: number
  name: string
}

function isAnnotationProgress(p: Progress): p is AnnotationProgress {
  return 'name' in p
}

const { t } = useI18n()
const rules = useRules(t)
// Not used in template
// eslint-disable-next-line vue/no-dupe-keys
const { meeting } = useMeeting()
const { allDataTypes } = useInviteAnnotations(meeting)

const annotatedDataTypes = computed(() => {
  return allDataTypes.value.map((dt) => {
    if (!meeting.value) throw new Error('Meeting is missing')
    const possibleValues = meetingInviteAnnotationPlugins
      .getPlugin(dt.name)
      ?.getPossibleValues?.(meeting.value)
    return { ...dt, possibleValues }
  })
})

const props = defineProps<{ meeting: number }>()
defineEmits<{ (e: 'close'): void }>()

const annotationForm = reactive({
  data: '',
  errors: {} as Dictionary<string[]>,
  expected: 1, // Expected amount of annotations to be added
  results: [] as AnnotationProgress[],
  submitting: false,
  valid: false
})

watch(
  () => annotationForm.data,
  () => {
    annotationForm.errors = {}
  }
)

function submitAnnotations() {
  annotationForm.submitting = true
  const [columns, ...rows] = annotationForm.data
    .split('\n')
    .map((row) => row.split('\t'))
  socket
    .call<unknown, AnnotationProgress | Progress>('invites.add_annotations', {
      columns,
      meeting: props.meeting,
      rows
    })
    .onProgress((p) => {
      if (isAnnotationProgress(p)) annotationForm.results.push(p)
      else annotationForm.expected = p.total
    })
    .catch((e) => {
      annotationForm.errors = parseSocketError(e as Error)
      annotationForm.results = []
    })
    .finally(() => {
      annotationForm.submitting = false
    })
}

function getSum(result: AnnotationProgress) {
  return result.added + result.changed + result.existed
}
</script>

<template>
  <template v-if="annotationForm.submitting">
    <p class="mb-3">
      {{ t('invites.annotate.working') }}
    </p>
    <v-progress-linear
      :max="annotationForm.expected"
      :model-value="annotationForm.results.length"
      color="success"
      bg-color="background"
    />
    <p v-if="annotationForm.results.length" class="text-secondary">
      {{
        t(
          'invites.annotate.annotatedType',
          { ...annotationForm.results.at(-1) },
          getSum(annotationForm.results.at(-1)!)
        )
      }}
    </p>
    <p v-else>&nbsp;</p>
  </template>
  <template v-else-if="annotationForm.results.length">
    <p class="mb-3">
      {{ t('invites.annotate.done') }}
    </p>
    <v-table>
      <thead>
        <tr>
          <th>Type</th>
          <th>Added</th>
          <th>Changed</th>
          <th>Existed</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in annotationForm.results" :key="r.name">
          <th>
            {{ r.name }}
          </th>
          <td>{{ r.added }}</td>
          <td>{{ r.changed }}</td>
          <td>{{ r.existed }}</td>
        </tr>
      </tbody>
    </v-table>
    <div class="text-right">
      <v-btn @click="$emit('close')" color="primary">
        {{ t('close') }}
      </v-btn>
    </div>
  </template>
  <template v-else>
    <v-alert type="info" :title="t('invites.annotate.helpTitle')" class="mb-3">
      <p class="mb-3">
        {{ t('invites.annotate.helpText') }}
      </p>
      <v-table density="compact">
        <thead>
          <tr>
            <th v-for="{ name } in annotatedDataTypes" :key="name">
              {{ name }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th
              v-for="{ name, possibleValues } in annotatedDataTypes"
              :key="name"
            >
              <DefaultDialog
                v-if="possibleValues"
                :title="t('invites.annotate.possibleValuesFor', { name })"
              >
                <template #activator="{ props }">
                  <v-btn
                    variant="tonal"
                    size="x-small"
                    icon="mdi-help"
                    v-bind="props"
                  />
                </template>
                <template #default="{ close }">
                  <v-table>
                    <thead>
                      <tr>
                        <th>{{ t('value') }}</th>
                        <th>{{ t('description') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="{ description, value } in possibleValues"
                        :key="value"
                      >
                        <td>
                          <strong>{{ value }}</strong>
                        </td>
                        <td class="text-secondary">{{ description || '-' }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                  <div class="text-right">
                    <v-btn variant="elevated" color="primary" @click="close">
                      {{ t('close') }}
                    </v-btn>
                  </div>
                </template>
              </DefaultDialog>
              <span v-else> ... </span>
            </th>
          </tr>
        </tbody>
      </v-table>
    </v-alert>
    <v-form
      @submit.prevent="submitAnnotations"
      v-model="annotationForm.valid"
      ref="invitationsForm"
    >
      <v-textarea
        v-model="annotationForm.data"
        class="mb-2"
        :error-messages="
          annotationForm.errors.columns ||
          annotationForm.errors.rows ||
          annotationForm.errors.__root__
        "
        rows="10"
        :rules="[
          rules.required,
          rules.tabSeparatedEqualColumns(annotatedDataTypes.length)
        ]"
      />
      <div class="text-right">
        <v-btn @click="$emit('close')" variant="text">
          {{ t('cancel') }}
        </v-btn>
        <v-btn
          type="submit"
          color="primary"
          prepend-icon="mdi-badge-account"
          :loading="annotationForm.submitting"
          :disabled="!annotationForm.valid || annotationForm.submitting"
          variant="elevated"
        >
          {{ t('add') }}
        </v-btn>
      </div>
    </v-form>
  </template>
</template>
