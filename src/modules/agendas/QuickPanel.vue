<template>
  <v-card-text>
    {{ t('agenda.itemCount', agenda.length) }}
  </v-card-text>
</template>

<script lang="ts" setup>
import { inject, Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { meetingIdKey } from '../meetings/injectionKeys'

import useAgenda from './useAgenda'

const { t } = useI18n()

const meetingId = inject(meetingIdKey) as Ref<number>
const { agenda } = useAgenda(meetingId)
</script>
