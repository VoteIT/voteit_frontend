<script setup lang="ts">
import { map, range, sorted } from 'itertools'
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { MeetingRole } from '../meetings/types'
import useMeeting from '../meetings/useMeeting'
import {
  SpeakerSystemEditable,
  SpeakerSystemMethod
} from '../speakerLists/types'
import { translateOrderMethod } from '../speakerLists/utils'

const SYSTEM_DEFAULT_SETTINGS = {
  [SpeakerSystemMethod.GenderPriority]: { max_times: 1 },
  [SpeakerSystemMethod.Priority]: { max_times: 1 },
  [SpeakerSystemMethod.Simple]: null
} as const

const props = defineProps<{
  disabled?: boolean
  hideTimeOption?: boolean
  modelValue?: SpeakerSystemEditable
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: SpeakerSystemEditable): void
}>()

const { t } = useI18n()
const { roleItems } = useMeeting()

const formData = reactive<SpeakerSystemEditable>(
  props.modelValue || {
    method_name: SpeakerSystemMethod.Simple,
    safe_positions: 1,
    settings: {
      max_times: 1
    },
    meeting_roles_to_speaker: [MeetingRole.Discusser],
    show_time: false
  }
)

watch(formData, (value) => emit('update:modelValue', value))
watch(
  () => formData.method_name,
  (method) => {
    formData.settings = SYSTEM_DEFAULT_SETTINGS[method]
  }
)

const systemMethods = computed(() =>
  sorted(
    [
      SpeakerSystemMethod.Simple,
      SpeakerSystemMethod.Priority,
      SpeakerSystemMethod.GenderPriority
    ].map((value) => ({
      value,
      title: translateOrderMethod(value, t)
    })),
    (m) => m.title
  )
)
</script>

<template>
  <div>
    <v-select
      :disabled="disabled"
      :items="systemMethods"
      :label="$t('speaker.systemMethod')"
      v-model="formData.method_name"
    />
    <v-expand-transition>
      <v-select
        v-if="formData.settings"
        :disabled="disabled"
        :hint="$t('speaker.orderMethod.maxTimesHint')"
        itemValue="const"
        :label="$t('speaker.orderMethod.maxTimes')"
        :items="
          map(range(10), (n) => ({
            const: n,
            title: t('speaker.orderMethod.maxTimesValue', n)
          }))
        "
        v-model="formData.settings.max_times"
      />
    </v-expand-transition>
    <v-select
      :disabled="disabled"
      :hint="$t('speaker.safePositionsHint')"
      itemValue="const"
      :label="$t('speaker.safePositions')"
      :items="
        map(range(3), (n) => ({
          const: n,
          title: $t('speaker.safePositionsValue', n)
        }))
      "
      v-model="formData.safe_positions"
    />
    <v-select
      multiple
      :disabled="disabled"
      :label="$t('speaker.speakerRoles')"
      :items="roleItems"
      v-model="formData.meeting_roles_to_speaker"
    />
    <v-checkbox
      v-if="!hideTimeOption"
      :disabled="disabled"
      :hint="$t('speaker.displayTimerHint')"
      :label="$t('speaker.displayTimer')"
      persistentHint
      v-model="formData.show_time"
    />
  </div>
</template>
