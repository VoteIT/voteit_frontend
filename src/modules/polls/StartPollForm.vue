<script setup lang="ts" generic="Settings">
import { shallowReactive, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import useRules from '@/composables/useRules'
import useProposalOrdering from '../proposals/useProposalOrdering'

import { Poll } from './types'
import { PollPlugin } from './registry'
import { pollType } from './contentTypes'

const props = defineProps<{
  allowStart: boolean
  createHandler(data: typeof poll, start: boolean): Promise<void>
  pollMethod: Omit<PollPlugin, 'criterion'>
  proposals: number
  title: string
}>()

const { t } = useI18n()
const { maxLength, required } = useRules(t)
const { proposalOrderingOptions } = useProposalOrdering(t)

const poll = shallowReactive({
  p_ord: 'c' as Poll['p_ord'],
  title: props.title,
  settings: props.pollMethod.getDefaultSettings?.(props.proposals) ?? null,
  withheld_result: false
})

const working = shallowRef(false)

async function createPoll(start = false) {
  working.value = true
  await props.createHandler(poll, start)
  working.value = false
}
</script>

<template>
  <v-form @submit.prevent v-slot="{ isValid }" validate-on="input eager">
    <v-text-field
      :label="$t('title')"
      :rules="[maxLength(70), required]"
      v-model="poll.title"
    />
    <v-select
      :items="proposalOrderingOptions"
      :label="$t('proposal.ordering')"
      :rules="[required]"
      v-model="poll.p_ord"
    />
    <component
      v-if="pollMethod.settingsComponent"
      :is="pollMethod.settingsComponent"
      :proposals="proposals"
      v-model="poll.settings"
    />
    <v-checkbox
      :label="$t('poll.result.withhold')"
      v-model="poll.withheld_result"
    />
    <div class="d-flex justify-end ga-1">
      <v-btn
        color="primary"
        :disabled="!isValid.value"
        :loading="working"
        prepend-icon="mdi-check"
        :text="$t('create')"
        variant="flat"
        @click="createPoll()"
      />
      <v-btn
        v-if="allowStart"
        color="primary"
        :disabled="!isValid.value"
        :loading="working"
        prepend-icon="mdi-play"
        :text="$t('poll.createAndStart')"
        variant="flat"
        @click="createPoll(true)"
      />
    </div>
  </v-form>
</template>
