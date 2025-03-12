<template>
  <main>
    <v-card
      v-if="!submitting"
      class="my-3"
      color="info"
      loading
      :text="stepData.info"
      :title="stepData.title"
    >
      <template #loader>
        <v-progress-linear
          :model-value="currentStep"
          :max="steps.length"
          color="primary"
        />
      </template>
    </v-card>
    <v-form @submit.prevent="nextStep" v-model="formReady" v-slot="{ isValid }">
      <v-progress-circular
        v-if="submitting"
        class="my-8"
        color="primary"
        indeterminate
      />
      <template v-else-if="currentStep === 0">
        <v-text-field
          :label="$t('title')"
          :rules="[rules.required, rules.minLength(5), rules.maxLength(100)]"
          maxlength="100"
          v-model="formData.meeting.title"
        />
        <v-select
          v-if="installableDialects"
          clearable
          item-value="name"
          :label="$t('meeting.dialect')"
          :hint="$t('meeting.dialectHint')"
          :items="installableDialects"
          v-model="formData.meeting.install_dialect"
        >
          <template #item="{ item, props }">
            <v-list-item
              v-bind="{ ...props, ...item.props }"
              :subtitle="
                item.raw.description ?? $t('meeting.dialectNoDescription')
              "
            />
          </template>
        </v-select>
      </template>
      <template v-else-if="currentStep === 1">
        <v-checkbox
          hide-details
          :label="$t('room.create')"
          v-model="formData.createRoom"
        />
        <v-text-field
          :disabled="!formData.createRoom"
          :label="$t('title')"
          v-model="formData.room.title"
          :rules="[rules.required]"
        />
        <v-checkbox
          hide-details
          :disabled="!formData.createRoom"
          :label="$t('speaker.useSpeakerLists')"
          :model-value="formData.createRoom && formData.createSpeakerSystem"
          @update:model-value="formData.createSpeakerSystem = !!$event"
        />
        <v-select
          :disabled="!formData.createRoom || !formData.createSpeakerSystem"
          :items="systemMethods"
          :label="$t('speaker.systemMethod')"
          v-model="formData.sls.method_name"
        />
        <v-expand-transition>
          <v-select
            v-if="formData.sls.method_name === SpeakerSystemMethod.Priority"
            :disabled="!formData.createRoom || !formData.createSpeakerSystem"
            :hint="$t('speaker.orderMethod.maxTimesHint')"
            itemValue="const"
            :label="$t('speaker.orderMethod.maxTimes')"
            :items="
              map(range(10), (n) => ({
                const: n,
                title: t('speaker.orderMethod.maxTimesValue', n)
              }))
            "
            v-model="formData.sls.settings.max_times"
          />
        </v-expand-transition>
        <v-select
          :disabled="!formData.createRoom || !formData.createSpeakerSystem"
          :hint="$t('speaker.safePositionsHint')"
          itemValue="const"
          :label="$t('speaker.safePositions')"
          :items="
            map(range(3), (n) => ({
              const: n,
              title: $t('speaker.safePositionsValue', n)
            }))
          "
          v-model="formData.sls.safe_positions"
        />
        <v-select
          multiple
          :disabled="!formData.createRoom || !formData.createSpeakerSystem"
          :label="$t('speaker.speakerRoles')"
          :items="roleItems"
          v-model="formData.sls.meeting_roles_to_speaker"
        />
      </template>
      <template v-else-if="currentStep === 2">
        <CardSelector
          color="success"
          :items="erMethods"
          v-model="formData.meeting.er_policy_name"
        >
          <template #actions="{ item }">
            <v-chip
              v-for="{ icon, text } in item.attributes"
              :key="text"
              :text="text"
              :prepend-icon="icon"
              class="mr-1"
            />
          </template>
        </CardSelector>
      </template>
      <div class="text-right mt-3">
        <v-btn
          class="mr-2"
          :text="$t('cancel')"
          variant="text"
          @click="$emit('close')"
        />
        <v-btn-group>
          <v-btn
            color="secondary"
            prepend-icon="mdi-chevron-left"
            :disabled="currentStep === 0"
            :text="$t('navigation.back')"
            @click="prevStep"
          />
          <v-btn
            type="submit"
            color="primary"
            :disabled="!isValid.value"
            v-bind="nextStepBtn"
          />
        </v-btn-group>
      </div>
    </v-form>
  </main>
</template>

<script lang="ts" setup>
import { map, range } from 'itertools'
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { slugify } from '@/utils'

import { meetingType } from './contentTypes'
import useElectoralRegisters, {
  getErAttributes
} from './electoralRegisters/useElectoralRegisters'
import useDialects from './dialects/useDialects'
import { Meeting, MeetingRole } from './types'
import useRules from '@/composables/useRules'
import { SpeakerSystem, SpeakerSystemMethod } from '../speakerLists/types'
import { translateOrderMethod } from '../speakerLists/utils'
import CardSelector from '@/components/CardSelector.vue'
import useMeeting from './useMeeting'
import { IMeetingRoom } from '../rooms/types'
import useErrorHandler from '@/composables/useErrorHandler'

type FormData = {
  meeting: {
    title: string
    er_policy_name: string | null
    install_dialect: string | null
  }
  createRoom: boolean
  createSpeakerSystem: boolean
  room: {
    title: string
  }
  sls: {
    meeting_roles_to_speaker: MeetingRole[]
    method_name: SpeakerSystemMethod
    safe_positions: number
    settings: {
      max_times: number
    }
  }
}

defineEmits(['close'])

const { t } = useI18n()
const router = useRouter()
const { roleItems } = useMeeting()
const { availableErMethods } = useElectoralRegisters()
const { installableDialects } = useDialects()
const rules = useRules(t)
const { handleRestError } = useErrorHandler({ target: 'dialog' })

const currentStep = ref(0)
const steps = computed<{ info: string; title: string }[]>(() => {
  const erStep = formData.meeting.install_dialect
    ? []
    : [
        {
          info: t('meeting.createErDescription'),
          title: t('meeting.createErTitle')
        }
      ]
  return [
    {
      info: t('meeting.createBaseDescription'),
      title: t('meeting.createBaseTitle')
    },
    {
      info: t('meeting.createRoomDescription'),
      title: t('meeting.createRoomTitle')
    },
    ...erStep
  ]
})
const stepData = computed(() => steps.value[currentStep.value])
const nextStepBtn = computed(() => {
  return currentStep.value === steps.value.length - 1
    ? {
        text: t('meeting.create'),
        appendIcon: 'mdi-check-all'
      }
    : {
        text: `${t('navigation.next')}: ${
          steps.value[currentStep.value + 1].title
        }`,
        appendIcon: 'mdi-chevron-right'
      }
})

function prevStep() {
  currentStep.value--
}

function nextStep() {
  // TODO Check if current is done
  if (currentStep.value === steps.value.length - 1) addMeeting()
  else currentStep.value++
}

const formData = reactive<FormData>({
  meeting: {
    title: '',
    er_policy_name: null,
    install_dialect: null
  },
  createRoom: false,
  createSpeakerSystem: true,
  room: {
    title: t('room.defaultName')
  },
  sls: {
    method_name: SpeakerSystemMethod.Simple,
    safe_positions: 1,
    settings: {
      max_times: 1
    },
    meeting_roles_to_speaker: [MeetingRole.Discusser]
  }
})
const formReady = ref(false)

const systemMethods = computed(() =>
  [SpeakerSystemMethod.Simple, SpeakerSystemMethod.Priority].map((value) => ({
    value,
    title: translateOrderMethod(value, t)
  }))
)

function annotateErMethod(
  method: NonNullable<(typeof availableErMethods)['value']>[number]
) {
  return {
    attributes: [...getErAttributes(method, t)],
    text: method.description,
    value: method.name,
    ...method
  }
}

const erMethods = computed(
  () => availableErMethods.value?.map(annotateErMethod) ?? []
)

watch(
  () => formData.meeting.install_dialect,
  (value) => {
    if (value) formData.meeting.er_policy_name = null
  }
)
const submitting = ref(false)

function cleanFormData(meeting: FormData['meeting']) {
  return {
    ...meeting,
    er_policy_name: meeting.er_policy_name || undefined,
    install_dialect: meeting.install_dialect || undefined
  } as Partial<Meeting> & {
    room?: Partial<IMeetingRoom>
    sls?: Partial<SpeakerSystem>
  }
}

async function addMeeting() {
  if (submitting.value) return
  submitting.value = true
  const createData = cleanFormData(formData.meeting)
  if (formData.createRoom) {
    createData.room = { ...formData.room }
    if (formData.createSpeakerSystem) createData.sls = { ...formData.sls }
  }
  try {
    const { data: meeting } = await meetingType.api.add(createData)
    await router.push(`/m/${meeting.pk}/${slugify(meeting.title)}`)
  } catch (e) {
    handleRestError(e)
  }
  submitting.value = false
}
</script>
