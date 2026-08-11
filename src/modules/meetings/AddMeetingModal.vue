<script lang="ts" setup>
import { sorted } from 'itertools'
import { computed, onBeforeMount, reactive, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { slugify } from '@/utils'
import CardSelector from '@/components/CardSelector.vue'
import useRules from '@/composables/useRules'
import useErrorHandler from '@/composables/useErrorHandler'

import { IMeetingRoom } from '../rooms/types'
import SpeakerSystemForm from '../rooms/SpeakerSystemForm.vue'
import {
  SpeakerSystem,
  SpeakerSystemEditable,
  SpeakerSystemMethod
} from '../speakerLists/types'

import { meetingType } from './contentTypes'
import useDialects from './dialects/useDialects'
import useElectoralRegisters from './electoralRegisters/useElectoralRegisters'
import { iterErAttributes } from './electoralRegisters/utils'
import { Meeting, MeetingRole } from './types'

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
  sls: SpeakerSystemEditable
}

defineEmits(['close'])

// Preselect this method if available
const PRESELECTED_ER_METHOD = 'auto_before_poll'

const { t } = useI18n()
const router = useRouter()
const { availableErMethods } = useElectoralRegisters()
const { installableDialects, loadDialects } = useDialects()
const rules = useRules(t)
const { handleRestError } = useErrorHandler({ target: 'dialog' })

onBeforeMount(() => loadDialects().catch(handleRestError))

const currentStep = shallowRef(0)
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
      info: t('meeting.createDialectDescription'),
      title: t('meeting.createDialectTitle')
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

const formValid = shallowRef(false)
function nextStep() {
  if (!formValid.value) return
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
    meeting_roles_to_speaker: [MeetingRole.Discusser],
    method_name: SpeakerSystemMethod.Simple,
    safe_positions: 1,
    settings: null,
    show_time: false
  }
})

function annotateErMethod(
  method: NonNullable<(typeof availableErMethods)['value']>[number]
) {
  return {
    attributes: [...iterErAttributes(method, t)],
    text: method.description,
    value: method.name,
    ...method
  }
}

const dialectItems = computed(() => [
  {
    title: t('meeting.createDialectNone'),
    text: t('meeting.createDialectNoneDescription'),
    value: null
  },
  ...(installableDialects.value ?? [])?.map(({ title, description, name }) => ({
    title,
    text: description,
    value: name
  }))
])

const erMethods = computed(() =>
  sorted(availableErMethods.value?.map(annotateErMethod) ?? [], (m) =>
    m.name === PRESELECTED_ER_METHOD ? 0 : 1
  )
)

watch(
  erMethods,
  (methods) => {
    if (formData.meeting.er_policy_name !== null) return
    if (methods.some((m) => m.name === PRESELECTED_ER_METHOD)) {
      formData.meeting.er_policy_name = PRESELECTED_ER_METHOD
    }
  },
  { immediate: true }
)

watch(
  () => formData.meeting.install_dialect,
  (value) => {
    if (value) {
      formData.meeting.er_policy_name = null
    } else if (
      formData.meeting.er_policy_name === null &&
      erMethods.value.some((m) => m.name === PRESELECTED_ER_METHOD)
    ) {
      formData.meeting.er_policy_name = PRESELECTED_ER_METHOD
    }
  }
)
const submitting = shallowRef(false)

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
    const meeting = await meetingType.api.add(createData)
    await router.push(`/m/${meeting.pk}/${slugify(meeting.title)}`)
  } catch (e) {
    handleRestError(e)
  }
  submitting.value = false
}
</script>

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
    <v-form @submit.prevent="nextStep" v-model="formValid" v-slot="{ isValid }">
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
      </template>
      <template v-else-if="currentStep === 1">
        <CardSelector
          color="success"
          :items="dialectItems"
          v-model="formData.meeting.install_dialect"
        />
      </template>
      <template v-else-if="currentStep === 2">
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
        <SpeakerSystemForm
          :disabled="!formData.createRoom || !formData.createSpeakerSystem"
          v-model="formData.sls"
          hide-time-option
        />
      </template>
      <template v-else-if="currentStep === 3">
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
