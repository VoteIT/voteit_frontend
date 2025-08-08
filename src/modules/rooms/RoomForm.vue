<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import type { JsonSchema } from '../forms/types'
import JsonSchemaForm from '../forms/JsonSchemaForm.vue'
import {
  SpeakerSystemEditable,
  SpeakerSystemMethod
} from '../speakerLists/types'
import { MeetingRole } from '../meetings/types'

import { IMeetingRoom } from './types'
import SpeakerSystemForm from './SpeakerSystemForm.vue'

type RoomEditData = Pick<IMeetingRoom, 'title'> & { speakers: boolean }

const props = defineProps<{
  data?: {
    room: RoomEditData
    speakerSystem?: SpeakerSystemEditable
  }
  slsDisabled?: boolean
  working: boolean
}>()

defineEmits<{
  (e: 'cancel'): void
  (e: 'submit', data: NonNullable<(typeof props)['data']>): void
}>()

const { t } = useI18n()

const schema = computed(
  () =>
    ({
      properties: {
        title: {
          type: 'string',
          label: t('title'),
          maxLength: 100
        },
        speakers: {
          readOnly: !!props.slsDisabled,
          type: 'boolean',
          label: t('speaker.lists', 2)
        }
      },
      required: ['title']
    }) as JsonSchema<RoomEditData>
)

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
      settings: {
        max_times: 1
      },
      show_time: false
    }
  }
}

const formData = reactive(getDefaults())
</script>

<template>
  <v-form @submit.prevent="$emit('submit', formData)" v-slot="{ isValid }">
    <JsonSchemaForm :schema="schema" v-model="formData.room" />
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
