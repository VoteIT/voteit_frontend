<script setup lang="ts">
import { computed, shallowReactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

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

const settings = shallowReactive(props.modelValue)

watch(settings, (value) => emit('update:modelValue', value))

function setWinners(value: number) {
  settings.winners = value === props.proposals ? null : value
}

const winnersHint = computed(() => {
  return settings.winners
    ? t('poll.schulze.winnerCount', settings.winners)
    : t('poll.schulze.rankAll')
})
</script>

<template>
  <v-slider
    :label="$t('winners')"
    :hint="winnersHint"
    persistent-hint
    :max="proposals"
    min="2"
    :model-value="settings.winners ?? proposals"
    step="1"
    @update:model-value="setWinners"
  >
    <template #append>
      <v-avatar
        color="secondary"
        :icon="settings.winners ? undefined : 'mdi-asterisk'"
        :text="settings.winners?.toString()"
      />
    </template>
  </v-slider>
  <v-slider
    :label="$t('poll.schulze.numberOfStars')"
    hide-details
    min="3"
    max="20"
    step="1"
    v-model="settings.stars"
  >
    <template #append>
      <v-avatar color="secondary" :text="settings.stars.toString()" />
    </template>
  </v-slider>
  <v-checkbox
    :disabled="proposals === 2"
    hide-details
    :label="$t('poll.schulze.addDenyProposal')"
    v-model="settings.deny_proposal"
  />
</template>
