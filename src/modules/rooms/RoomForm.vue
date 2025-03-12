<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import useMeeting from '../meetings/useMeeting'
import { MeetingRole } from '../meetings/types'
import type { JsonObject, JsonSchema } from '../forms/types'
import JsonSchemaForm from '../forms/JsonSchemaForm.vue'
import { SpeakerSystem, SpeakerSystemMethod } from '../speakerLists/types'
import { translateOrderMethod } from '../speakerLists/utils'

import { IMeetingRoom } from './types'
import { map, range } from 'itertools'

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
  Record<SpeakerSystemMethod, JsonObject<{ max_times: number }>>
> = {
  priority: {
    type: 'object',
    properties: {
      max_times: {
        type: 'number',
        label: t('speaker.orderMethod.maxTimes'),
        hint: t('speaker.orderMethod.maxTimesHint'),
        minimum: 0,
        oneOf: map(range(10), (n) => ({
          const: n,
          title: t('speaker.orderMethod.maxTimesValue', n)
        }))
      }
    },
    required: ['max_times']
  }
}

// TODO any?
function getSettings(method: SpeakerSystemMethod): any {
  const properties = speakerMethodSettingSchema[method]
  if (properties) return { settings: properties }
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
          oneOf: map(range(3), (n) => ({
            const: n,
            title: t('speaker.safePositionsValue', n)
          }))
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
      required: ['method_name', 'meeting_roles_to_speaker', 'safe_positions']
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
        settings: {
          max_times: 1
        },
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
