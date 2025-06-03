<script setup lang="ts">
import { map, range } from 'itertools'
import { computed, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { onKeyStroke } from '@vueuse/core'

import { openAlertEvent } from '@/utils/events'
import { navigationEventAllowed } from '@/utils/keyNavigation'
import UserAvatar from '@/components/UserAvatar.vue'
import User from '@/components/User.vue'
import Moment from '@/components/Moment.vue'
import UserSearch from '@/components/UserSearch.vue'
import { user } from '@/composables/useAuthentication'
import useErrorHandler from '@/composables/useErrorHandler'

import useParticipantNumbers from '../participantNumbers/useParticipantNumbers'
import useMeetingId from '../meetings/useMeetingId'
import { IUser } from '../organisations/types'

import useSpeakerList from './useSpeakerList'
import * as speakerRules from './rules'
import SpeakerEntry from './SpeakerEntry.vue'

const props = defineProps<{
  listId: number
}>()

const { t } = useI18n()

const meetingId = useMeetingId()
const {
  canStartSpeaker,
  currentSpeaker,
  speakerGroups,
  speakerSystem,
  speakerQueue,
  moderatorEnterList,
  moderatorLeaveList,
  shuffleList,
  startSpeaker,
  stopSpeaker,
  undoSpeaker
} = useSpeakerList(toRef(props, 'listId'))
const { hasParticipantNumbers, participantNumbers } =
  useParticipantNumbers(meetingId)

const canManageSystem = computed(
  () => speakerSystem.value && speakerRules.canManageSystem(speakerSystem.value)
)

// For user search
const userSearchParams = computed(() => {
  return {
    meeting: meetingId.value,
    any_roles: speakerSystem.value?.meeting_roles_to_speaker.join(',')
  }
})
// Filter on users that are speakers but not already in queue
function userSearchFilter(user: IUser): boolean {
  if (!speakerQueue.value || !speakerSystem.value) return false
  return !speakerQueue.value.includes(user.pk)
}

function isSelf(userId: number) {
  return user.value?.pk === userId
}

const participantNumberInput = ref('')
async function addParticipantNumbers() {
  const numbers = participantNumberInput.value
    .split(/[^\d]+/)
    .filter((n) => n)
    .map(Number)
  const inList: number[] = []
  const missing: number[] = []
  for (const n of numbers) {
    const user = participantNumbers.value.find((pn) => pn.number === n)?.user
    if (!user) missing.push(n)
    else if (speakerQueue.value?.includes(user)) inList.push(n)
    else moderatorEnterList(user)
  }
  if (missing.length)
    openAlertEvent.emit(
      '*' +
        t(
          'participantNumber.doesNotExist',
          { ids: missing.join(', ') },
          missing.length
        )
    )
  if (inList.length)
    openAlertEvent.emit(
      '*' +
        t(
          'participantNumber.alreadyInList',
          { ids: inList.join(', ') },
          inList.length
        )
    )
  participantNumberInput.value = ''
}

const { handleSocketError } = useErrorHandler({
  target: 'alert'
})
function errorWrapper(
  fnOrPromise: Promise<unknown> | (() => Promise<unknown>)
) {
  ;(typeof fnOrPromise === 'function' ? fnOrPromise() : fnOrPromise).catch(
    handleSocketError
  )
}

/*
 * Keyboard navigation
 */
onKeyStroke(
  (e) => map(range(1, 10), String).includes(e.key) && navigationEventAllowed(e),
  (e) => {
    const speaker = speakerQueue.value[Number(e.key) - 1]
    if (!speaker) return
    errorWrapper(startSpeaker(speaker))
  }
)
onKeyStroke(
  (e) => e.key === 'z' && navigationEventAllowed(e, ['ctrlKey']),
  (e) => e.ctrlKey && errorWrapper(undoSpeaker)
)
onKeyStroke(
  (e) => e.key === 's' && navigationEventAllowed(e),
  () => errorWrapper(startSpeaker)
)
onKeyStroke(
  (e) => e.key === 'e' && navigationEventAllowed(e),
  () => currentSpeaker.value && errorWrapper(stopSpeaker)
)
/*
 * End keyboard navigation
 */
</script>

<template>
  <div>
    <div class="btn-group mb-2">
      <v-btn
        color="primary"
        :disabled="!canStartSpeaker || !speakerQueue.length"
        @click="startSpeaker()"
        ><v-icon icon="mdi-play"
      /></v-btn>
      <v-btn
        color="primary"
        :disabled="!currentSpeaker"
        @click="errorWrapper(stopSpeaker)"
        ><v-icon icon="mdi-stop"
      /></v-btn>
      <v-btn
        color="primary"
        :disabled="!currentSpeaker"
        @click="errorWrapper(undoSpeaker)"
        ><v-icon icon="mdi-undo"
      /></v-btn>
      <v-btn
        color="primary"
        :disabled="!speakerQueue.length"
        @click="errorWrapper(shuffleList)"
        ><v-icon icon="mdi-shuffle-variant"
      /></v-btn>
    </div>
    <div class="d-flex no-keynav" v-if="canManageSystem">
      <UserSearch
        :label="$t('speaker.addByName')"
        :filter="userSearchFilter"
        @submit="moderatorEnterList"
        :params="userSearchParams"
        instant
        class="flex-grow-1"
      />
      <template v-if="hasParticipantNumbers">
        <div style="width: 10px"></div>
        <v-text-field
          :label="$t('speaker.addByParticipantNumber')"
          class="mb-0 flex-grow-1"
          v-model="participantNumberInput"
          @keydown.enter="addParticipantNumbers()"
        />
      </template>
    </div>
    <p v-else>
      <em>{{ $t('speaker.cantManageList') }}</em>
    </p>
    <v-sheet elevation="4" rounded="lg" v-if="currentSpeaker" class="my-4 pa-3">
      <div class="d-flex mb-2 align-center">
        <UserAvatar :pk="currentSpeaker.user" class="mr-2" />
        <User :pk="currentSpeaker.user" style="font-size: 1.2rem" />
      </div>
      <p class="text-h3 text-right">
        <Moment in-seconds ordinary :date="currentSpeaker.started" />
      </p>
    </v-sheet>
    <v-list
      v-if="speakerGroups.length"
      density="comfortable"
      bg-color="background"
    >
      <template v-for="{ title, queue } in speakerGroups" :key="title">
        <v-list-subheader v-if="title" class="mt-3">
          {{ title }}
        </v-list-subheader>
        <SpeakerEntry
          v-for="user in queue"
          :key="user"
          :user="user"
          :class="{ self: isSelf(user) }"
        >
          <template #append>
            <span class="btn-group d-flex flex-nowrap">
              <v-btn
                color="primary"
                :disabled="!canStartSpeaker"
                @click="startSpeaker(user)"
                size="x-small"
              >
                <v-icon icon="mdi-play" />
              </v-btn>
              <v-btn
                color="warning"
                @click="moderatorLeaveList(user)"
                size="x-small"
              >
                <v-icon icon="mdi-delete" />
              </v-btn>
            </span>
          </template>
        </SpeakerEntry>
      </template>
    </v-list>
    <p v-else class="mt-4">
      <em>{{ $t('speaker.queueEmpty') }}</em>
    </p>
  </div>
</template>
