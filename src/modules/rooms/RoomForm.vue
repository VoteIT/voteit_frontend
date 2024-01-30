<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import useMeeting from '../meetings/useMeeting'
import { MeetingRole } from '../meetings/types'
import type { JsonProperties, JsonSchema } from '../forms/types'
import JsonSchemaForm from '../forms/JsonSchemaForm.vue'
import { SpeakerSystem, SpeakerSystemMethod } from '../speakerLists/types'
import { translateOrderMethod } from '../speakerLists/utils'

import { IMeetingRoom } from './types'

type RoomEditData = Pick<IMeetingRoom, 'title'> & { speakers: boolean }
type SlsEditData = Pick<
  SpeakerSystem,
  | 'method_name'
  | 'safe_positions'
  | 'settings'
  | 'meeting_roles_to_speaker'
  | 'show_time'
>

const props = defineProps<{
  data?: {
    room: RoomEditData
    speakerSystem?: SlsEditData
  }
  slsDisabled?: boolean
  working: boolean
}>()

defineEmits<{
  (e: 'cancel'): void
  (e: 'submit', data: NonNullable<(typeof props)['data']>): void
}>()

const { t } = useI18n()
const { roleItems } = useMeeting()

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

const speakerMethodSettingSchema: Partial<
  Record<SpeakerSystemMethod, JsonProperties<any>>
> = {
  priority: {
    max_times: {
      type: 'number',
      label: t('speaker.orderMethod.maxTimes'),
      hint: t('speaker.orderMethod.maxTimesHint'),
      minimum: 0
    }
  }
}

// TODO any?
function getSettings(method: SpeakerSystemMethod): any {
  const properties = speakerMethodSettingSchema[method]
  if (properties) return { settings: { type: 'object', properties } }
}

const slsSchema = computed(
  () =>
    ({
      properties: {
        method_name: {
          readOnly: !!props.slsDisabled,
          type: 'string',
          label: t('speaker.systemMethod'),
          oneOf: [SpeakerSystemMethod.Simple, SpeakerSystemMethod.Priority].map(
            (m) => ({ const: m, title: translateOrderMethod(m, t) })
          )
        },
        ...getSettings(formData.speakerSystem.method_name),
        safe_positions: {
          readOnly: !!props.slsDisabled,
          type: 'number',
          hint: t('speaker.safePositionsHint'),
          label: t('speaker.safePositions'),
          minimum: 0
        },
        meeting_roles_to_speaker: {
          readOnly: !!props.slsDisabled,
          label: t('speaker.speakerRoles'),
          type: 'array',
          items: {
            type: 'string',
            oneOf: roleItems.value.map((i) => ({
              const: i.value,
              title: i.title
            }))
          }
        },
        show_time: {
          readOnly: !!props.slsDisabled,
          label: t('speaker.displayTimer'),
          type: 'boolean',
          hint: t('speaker.displayTimerHint')
        }
      },
      required: ['method_name', 'meeting_roles_to_speaker']
    }) as JsonSchema<SlsEditData>
)

function getDefaults() {
  const { room, speakerSystem } = props.data || {}
  return {
    room: {
      title: room?.title ?? '',
      speakers: room?.speakers ?? false
    },
    speakerSystem:
      speakerSystem ||
      ({
        meeting_roles_to_speaker: [MeetingRole.Discusser],
        method_name: SpeakerSystemMethod.Simple,
        safe_positions: 1,
        settings: null,
        show_time: false
      } as SlsEditData)
  }
}

const formData = reactive(getDefaults())
</script>

<template>
  <v-form @submit.prevent="$emit('submit', formData)" v-slot="{ isValid }">
    <JsonSchemaForm :schema="schema" v-model="formData.room" />
    <JsonSchemaForm
      v-if="formData.room.speakers"
      :schema="slsSchema"
      v-model="formData.speakerSystem"
    />
    <div class="text-right">
      <v-btn variant="text" @click="$emit('cancel')">
        {{ t('cancel') }}
      </v-btn>
      <v-btn
        color="primary"
        type="submit"
        :disabled="!isValid.value"
        :loading="working"
      >
        {{ data ? t('save') : t('create') }}
      </v-btn>
    </div>
  </v-form>
</template>
