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
import useErrorHandler from '@/composables/useErrorHandler'

import useAuthStore from '../auth/useAuthStore'
import useParticipantNumbers from '../participantNumbers/useParticipantNumbers'
import useMeetingId from '../meetings/useMeetingId'
import { IUser } from '../organisations/types'

import useSpeakerList from './useSpeakerList'
import * as speakerRules from './rules'
import SpeakerEntry from './SpeakerEntry.vue'
import useSpeakerGroups from './useSpeakerGroups'
import useSpeakerStore from './useSpeakerStore'

const props = defineProps<{
  listId: number
  keyBindings: 'all' | 'startStop'
}>()

const { t } = useI18n()
const authStore = useAuthStore()
const { speakerApi } = useSpeakerStore()

const meetingId = useMeetingId()
const listId = computed(() => props.listId)
const {
  canStartSpeaker,
  speakerSystem,
  speakerQueue,
  userQueue,
  startSpeaker,
  stopSpeaker,
  undoSpeaker
} = useSpeakerList(toRef(props, 'listId'))
const { currentSpeaker, speakerGroups } = useSpeakerGroups(listId, t)
const { handleRestError } = useErrorHandler({ target: 'dialog' })

/**
 * Speaker actions, with errors reported to the user.
 */
async function handled(action: () => Promise<unknown>) {
  try {
    await action()
  } catch (e) {
    handleRestError(e)
  }
}
const handle = {
  start: (speaker?: number) => handled(() => startSpeaker(speaker)),
  stop: () => handled(stopSpeaker),
  undo: () => handled(undoSpeaker),
  add: (user: number) => handled(() => speakerApi.add(props.listId, user)),
  remove: (speaker: number) => handled(() => speakerApi.delete(speaker))
}
const { hasParticipantNumbers, participantNumbers } =
  useParticipantNumbers(meetingId)

const canManageSystem = computed(
  () => speakerSystem.value && speakerRules.canManageSystem(speakerSystem.value)
)

/**
 * Users that are already speaking or in queue can't be added to queue
 */
function checkUserInQueue(user: number) {
  return !!userQueue.value?.includes(user)
}

// For user search
const userSearchParams = computed(() => {
  return {
    meeting: meetingId.value,
    any_roles: speakerSystem.value?.meeting_roles_to_speaker.join(',')
  }
})
// Filter on users that are speakers but not already in queue or speaking
function userSearchFilter({ pk }: IUser): boolean {
  if (!speakerQueue.value || !speakerSystem.value) return false
  return !checkUserInQueue(pk)
}

function isSelf(userId: number) {
  return authStore.user?.pk === userId
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
    else if (checkUserInQueue(user)) inList.push(n)
    else handle.add(user)
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

/*
 * Keyboard navigation
 */
if (props.keyBindings === 'all')
  onKeyStroke(
    (e) =>
      map(range(1, 10), String).includes(e.key) && navigationEventAllowed(e),
    (e) => {
      const speaker = speakerQueue.value[Number(e.key) - 1]
      if (!speaker) return
      handle.start(speaker.pk)
    }
  )
onKeyStroke(
  (e) => e.key === 'z' && navigationEventAllowed(e, ['ctrlKey']),
  (e) => e.ctrlKey && currentSpeaker.value && handle.undo()
)
onKeyStroke(
  (e) => e.key === 's' && navigationEventAllowed(e),
  () => canStartSpeaker.value && speakerQueue.value.length && handle.start()
)
onKeyStroke(
  (e) => e.key === 'e' && navigationEventAllowed(e),
  () => currentSpeaker.value && handle.stop()
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
        @click="handle.start()"
        ><v-icon icon="mdi-play"
      /></v-btn>
      <v-btn color="primary" :disabled="!currentSpeaker" @click="handle.stop"
        ><v-icon icon="mdi-stop"
      /></v-btn>
      <v-btn color="primary" :disabled="!currentSpeaker" @click="handle.undo"
        ><v-icon icon="mdi-undo"
      /></v-btn>
    </div>
    <div class="d-flex no-keynav" v-if="canManageSystem">
      <UserSearch
        :label="$t('speaker.addByName')"
        :filter="userSearchFilter"
        @submit="handle.add($event)"
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
          @keydown.enter="addParticipantNumbers"
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
          v-for="speaker in queue"
          :key="speaker.pk"
          :annotations="speaker.annotations"
          :user="speaker.user"
          :class="{ self: isSelf(speaker.user) }"
        >
          <template #append>
            <span class="btn-group d-flex flex-nowrap">
              <v-btn
                color="primary"
                :disabled="!canStartSpeaker"
                @click="handle.start(speaker.pk)"
                size="x-small"
              >
                <v-icon icon="mdi-play" />
              </v-btn>
              <v-btn
                color="warning"
                @click="handle.remove(speaker.pk)"
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
