<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { userId } from '@/composables/useAuthentication'
import useErrorHandler from '@/composables/useErrorHandler'
import DefaultDialog from '@/components/DefaultDialog.vue'
import useMeetingId from '../meetings/useMeetingId'
import useParticipantTags from '../meetings/participantTags/useParticipantTags'

import useSpeakerList from './useSpeakerList'
import useGenderTag from './genderTags/useGenderTag'
import { GENDER_ICONS, translateGender } from './genderTags/utils'
import { SpeakerList, SpeakerSystemMethod } from './types'

const props = defineProps<{
  list: SpeakerList
}>()

const { t } = useI18n()
const meetingId = useMeetingId()
const { handleRestError } = useErrorHandler({ target: 'dialog' })
const { canEnterList, canLeaveList, speakerSystem, enterList, leaveList } =
  useSpeakerList(props.list.pk)
const genderTag = useGenderTag(meetingId, userId)
const { setTags } = useParticipantTags(meetingId)

const genderWanted = computed(
  () =>
    speakerSystem.value?.method_name === SpeakerSystemMethod.GenderPriority &&
    !genderTag.value
)

const working = shallowRef(false)

async function enter(tag?: GenderTag, close?: () => void) {
  working.value = true
  if (tag) {
    try {
      await setTags('gen', tag)
    } catch {
      // Handled automatically in rest api
    }
  }
  try {
    await enterList()
  } catch (e) {
    handleRestError(e)
  }
  if (close) close()
  working.value = false
}

async function leave() {
  working.value = true
  try {
    await leaveList()
  } catch (e) {
    handleRestError(e)
  }
  working.value = false
}

const genderChoices = Object.entries(GENDER_ICONS).map(([tag, icon]) => ({
  icon,
  tag: tag as GenderTag,
  text: translateGender(t, tag as GenderTag)
}))
</script>

<template>
  <div v-if="canEnterList || canLeaveList">
    <v-btn
      v-if="canLeaveList"
      color="warning"
      :loading="working"
      prepend-icon="mdi-account-voice-off"
      :text="$t('speaker.leaveList')"
      @click="leave"
    />
    <DefaultDialog
      v-else-if="genderWanted"
      :title="$t('speaker.gender.select')"
    >
      <template #activator="{ props }">
        <v-btn
          color="primary"
          :loading="working"
          prepend-icon="mdi-account-voice"
          :text="$t('speaker.enterList')"
          v-bind="props"
        />
      </template>
      <template #default="{ close }">
        <p class="mb-3">
          {{ $t('speaker.gender.selectToEnter') }}
        </p>
        <div class="d-flex flex-column ga-2">
          <v-btn
            v-for="{ icon, tag, text } in genderChoices"
            color="primary"
            :prepend-icon="icon"
            size="large"
            :text="text"
            @click="enter(tag, close)"
          />
          <v-btn
            color="secondary"
            prepend-icon="mdi-cancel"
            :text="$t('speaker.gender.skip')"
            @click="enter(undefined, close)"
          />
          <v-btn :text="$t('cancel')" variant="text" @click="close" />
        </div>
      </template>
    </DefaultDialog>
    <v-btn
      v-else
      color="primary"
      :loading="working"
      prepend-icon="mdi-account-voice"
      :text="$t('speaker.enterList')"
      @click="enter()"
    />
  </div>
</template>
