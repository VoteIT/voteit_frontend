<script setup lang="ts">
/**
 * Postpone a removal request: either just stop the reminders, or also tell
 * other managers not to remove the user yet.
 */
import { shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogAlert } from '@/utils'
import { DAY } from '@/utils/dates'
import { isApiError, parseRestError } from '@/utils/restApi'
import { ThemeColor } from '@/utils/types'
import DefaultDialog from '@/components/DefaultDialog.vue'

import { PostponeKind, type RemovalRequest } from './types'
import useRemovalRequests from './useRemovalRequests'

const props = defineProps<{
  request: RemovalRequest
}>()

const { t } = useI18n()
const { postponeRequest } = useRemovalRequests()

const kinds = [
  {
    value: PostponeKind.Remind,
    title: () => t('organization.removalRequests.postpone.kind.remind'),
    help: () => t('organization.removalRequests.postpone.kind.remindHelp')
  },
  {
    value: PostponeKind.Block,
    title: () => t('organization.removalRequests.postpone.kind.block'),
    help: () => t('organization.removalRequests.postpone.kind.blockHelp')
  }
]

const durations = [
  {
    days: 1,
    title: () => t('organization.removalRequests.postpone.durations.day')
  },
  {
    days: 7,
    title: () => t('organization.removalRequests.postpone.durations.week')
  },
  {
    days: 14,
    title: () => t('organization.removalRequests.postpone.durations.twoWeeks')
  },
  {
    days: 30,
    title: () => t('organization.removalRequests.postpone.durations.month')
  },
  {
    days: 90,
    title: () =>
      t('organization.removalRequests.postpone.durations.threeMonths')
  }
]

const isOpen = shallowRef(false)
const kind = shallowRef(PostponeKind.Remind)
const days = shallowRef(7)
const error = shallowRef<string>()
const working = shallowRef(false)

function reset() {
  kind.value = props.request.postponed?.kind ?? PostponeKind.Remind
  days.value = 7
  error.value = undefined
}

async function submit() {
  if (working.value) return
  working.value = true
  error.value = undefined
  try {
    await postponeRequest(
      props.request.user.pk,
      kind.value,
      new Date(Date.now() + days.value * DAY)
    )
    isOpen.value = false
  } catch (e) {
    if (isApiError(e) && e.status === 404) {
      isOpen.value = false
      dialogAlert(t('organization.removalRequests.gone'), ThemeColor.Info)
    } else error.value = Object.values(parseRestError(e)).flat().join(' ')
  }
  working.value = false
}
</script>

<template>
  <DefaultDialog
    v-model="isOpen"
    :persistent="working"
    :title="$t('organization.removalRequests.postpone.title')"
    @open="reset"
  >
    <template #activator="attrs">
      <slot name="activator" v-bind="attrs"></slot>
    </template>
    <template #default="{ close }">
      <form @submit.prevent="submit">
        <v-radio-group v-model="kind" :disabled="working">
          <v-radio v-for="k in kinds" :key="k.value" :value="k.value">
            <template #label>
              <div>
                <div>{{ k.title() }}</div>
                <div class="text-body-2 text-secondary">{{ k.help() }}</div>
              </div>
            </template>
          </v-radio>
        </v-radio-group>
        <v-select
          v-model="days"
          :disabled="working"
          :items="durations.map((d) => ({ value: d.days, title: d.title() }))"
          :label="$t('organization.removalRequests.postpone.duration')"
        />
        <v-alert v-if="error" class="mb-4" :text="error" type="error" />
        <div class="d-flex ga-1 justify-end">
          <v-btn
            :disabled="working"
            :text="$t('cancel')"
            variant="text"
            @click="close"
          />
          <v-btn
            color="primary"
            :loading="working"
            :text="$t('organization.removalRequests.postpone.save')"
            type="submit"
          />
        </div>
      </form>
    </template>
  </DefaultDialog>
</template>
