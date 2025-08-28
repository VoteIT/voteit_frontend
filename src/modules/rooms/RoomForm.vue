<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import useRules from '@/composables/useRules'
import {
  SpeakerSystemEditable,
  SpeakerSystemMethod
} from '../speakerLists/types'
import { MeetingRole } from '../meetings/types'

import { IMeetingRoom } from './types'
import SpeakerSystemForm from './SpeakerSystemForm.vue'

interface IFormData {
  room: Pick<IMeetingRoom, 'title'> & { speakers: boolean }
  speakerSystem?: SpeakerSystemEditable
}

const props = defineProps<{
  data?: IFormData
  slsDisabled?: boolean
  working: boolean
}>()

defineEmits<{
  (e: 'cancel'): void
  (e: 'submit', data: IFormData): void
}>()

const { t } = useI18n()

const rules = useRules(t)

function getDefaults() {
  const { room, speakerSystem } = props.data || {}
  return {
    room: {
      title: room?.title ?? '',
      speakers: room?.speakers ?? false
    },
    speakerSystem: speakerSystem || {
      meeting_roles_to_speaker: [MeetingRole.Discusser],
      method_name: SpeakerSystemMethod.Simple,
      safe_positions: 1,
      settings: null,
      show_time: false
    }
  }
}

const formData = reactive(getDefaults())
</script>

<template>
  <v-form @submit.prevent="$emit('submit', formData)" v-slot="{ isValid }">
    <v-text-field
      :label="$t('title')"
      :rules="[rules.required, rules.maxLength(100)]"
      v-model="formData.room.title"
    />
    <v-checkbox
      :readonly="slsDisabled"
      :label="$t('speaker.lists', 2)"
      v-model="formData.room.speakers"
    />
    <SpeakerSystemForm
      class="mb-3"
      :disabled="!formData.room.speakers"
      v-model="formData.speakerSystem"
    />
    <div class="text-right">
      <v-btn variant="text" :text="$t('cancel')" @click="$emit('cancel')" />
      <v-btn
        color="primary"
        :disabled="!isValid.value"
        :loading="working"
        :text="data ? $t('save') : $t('create')"
        type="submit"
      />
    </div>
  </v-form>
</template>
