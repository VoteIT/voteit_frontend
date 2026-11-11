<script setup lang="ts">
import { shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'
import useErrorHandler from '@/composables/useErrorHandler'
import useRules from '@/composables/useRules'

import useVoteRetention from './useVoteRetention'

const { t } = useI18n()
const rules = useRules(t)
const { handled } = useErrorHandler({ target: 'dialog' })
const { autoClear, changed, days, needsConfirm, save } = useVoteRetention()

const saving = shallowRef(false)

async function submit() {
  if (!changed.value) return
  if (
    needsConfirm.value &&
    !(await dialogQuery({
      title: t('organization.voteRetention.confirmAutoClear', {
        days: days.value
      }),
      theme: ThemeColor.Warning
    }))
  )
    return
  saving.value = true
  await handled(save)
  saving.value = false
}
</script>

<template>
  <p class="mb-6">{{ $t('organization.voteRetention.intro') }}</p>
  <v-form @submit.prevent="submit" v-slot="{ isValid }">
    <v-text-field
      class="mb-4"
      :hint="$t('organization.voteRetention.daysHint')"
      :label="$t('organization.voteRetention.days')"
      min="1"
      persistent-hint
      :rules="[rules.required, rules.min(1)]"
      step="1"
      :suffix="$t('organization.voteRetention.daysSuffix')"
      type="number"
      v-model.number="days"
    />
    <v-checkbox
      :hint="$t('organization.voteRetention.autoClearHint')"
      :label="$t('organization.voteRetention.autoClear')"
      persistent-hint
      v-model="autoClear"
    />
    <div class="d-flex mt-4">
      <v-spacer />
      <v-btn
        color="primary"
        :disabled="!isValid.value || !changed"
        :loading="saving"
        :text="$t('save')"
        type="submit"
      />
    </div>
  </v-form>
</template>
