<script setup lang="ts">
import { shallowReactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useRules from '@/composables/useRules'

interface Settings {
  deny_proposal: boolean
  stars: number
  winners: number | null
}

const props = defineProps<{
  modelValue: Settings
  proposals: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Settings): void
}>()

const { t } = useI18n()
const { required, max, min } = useRules(t)

const settings = shallowReactive(props.modelValue)

watch(settings, (value) => emit('update:modelValue', value))
</script>

<template>
  <v-text-field
    clearable
    :hint="$t('poll.repeated_schulze.winnersHint')"
    :label="$t('winners')"
    :max="proposals"
    min="2"
    :rules="[max(proposals), min(2)]"
    type="number"
    v-model="settings.winners"
  />
  <v-text-field
    :label="$t('poll.schulze.numberOfStars')"
    max="20"
    min="3"
    :rules="[max(20), min(3), required]"
    type="number"
    v-model="settings.stars"
  />
  <v-checkbox
    :disabled="proposals === 2"
    hide-details
    :label="$t('poll.schulze.addDenyProposal')"
    v-model="settings.deny_proposal"
  />
</template>
