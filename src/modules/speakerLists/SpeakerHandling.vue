<script lang="ts" setup>
import { Duration } from 'luxon'
import { map, range } from 'itertools'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onKeyStroke } from '@vueuse/core'

import { dialogQuery, durationToString } from '@/utils'
import { MenuItem, ThemeColor } from '@/utils/types'
import createFormSchema from '@/utils/createFormSchema'
import useChannel from '@/composables/useChannel'
import useLoader from '@/composables/useLoader'
import useAlert from '@/composables/useAlert'
import DefaultDialog from '@/components/DefaultDialog.vue'
import DropdownMenu from '@/components/DropdownMenu.vue'
import QueryDialog from '@/components/QueryDialog.vue'
import useAuthentication from '@/composables/useAuthentication'
import Moment from '@/components/Moment.vue'
import SchemaForm from '@/components/SchemaForm.vue'
import User from '@/components/User.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import UserSearch from '@/components/UserSearch.vue'
import { FieldType, FormSchema } from '@/components/types'

import useAgenda from '../agendas/useAgenda'
import useMeeting from '../meetings/useMeeting'
import useParticipantNumbers from '../participantNumbers/useParticipantNumbers'
import type { IUser } from '../organisations/types'

import {
  canActivateList,
  canChangeSpeakerList,
  canDeleteSpeakerList,
  canStartSpeaker
} from './rules'
import { speakerType, speakerListType } from './contentTypes'
import useSpeakerLists from './useSpeakerLists'
import useSpeakerList from './useSpeakerList'
import useSpeakerSystem from './useSpeakerSystem'
import { openAlertEvent } from '@/utils/events'

import type { SpeakerList, SpeakerListAddMessage } from './types'

const props = defineProps<{
  systemId: number
}>()

const SPEAKER_HISTORY_CAP = 3

const timeSpokenSchema: FormSchema = [
  {
    label: 'Time spoken',
    name: 'seconds',
    type: FieldType.Duration
  }
]

const { t } = useI18n()
const { alert } = useAlert()

const { user } = useAuthentication()
const speakers = useSpeakerLists()
const { meetingId } = useMeeting()
const systemId = computed(() => props.systemId)
const { agendaId, agendaItem } = useAgenda(meetingId)

useLoader(
  'SpeakerListsView',
  useChannel('agenda_item', agendaId).promise,
  useChannel('sls', systemId).promise
)

const {
  canManageSystem,
  speakerSystem,
  speakerLists,
  systemActiveList,
  systemActiveListId
} = useSpeakerSystem(systemId, agendaId)
const currentList = computed<SpeakerList | undefined>({
  get() {
    if (systemActiveList.value?.agenda_item !== agendaId.value) return
    return systemActiveList.value
  },
  async set(list?: SpeakerList) {
    if (!list) return
    if (canActivateList(list)) speakers.setActiveList(list)
    else if (
      await dialogQuery(t('speaker.confirmStopActiveSpeaker', { ...list }))
    )
      speakers.setActiveList(list, true)
  }
})
const {
  annotatedSpeakerQueue,
  currentSpeaker,
  speakerGroups,
  speakerHistory,
  speakerQueue
} = useSpeakerList(systemActiveListId)
function isSelf(userId: number) {
  return user.value?.pk === userId
}

/*
 * Navigation
 */

function onNonInputTarget(fn: (e: KeyboardEvent) => void) {
  return (evt: KeyboardEvent) => {
    if (((evt.target as Element) || null)?.tagName === 'INPUT') return
    fn(evt)
  }
}
onKeyStroke(
  map(range(1, 10), String),
  onNonInputTarget((e) => {
    const speaker = speakerQueue.value[Number(e.key) - 1]
    if (!speaker || !currentList.value) return
    speakers.startSpeaker(currentList.value, speaker)
  })
)
onKeyStroke(
  'z',
  onNonInputTarget(
    (e) =>
      e.ctrlKey && currentList.value && speakers.undoSpeaker(currentList.value)
  )
)
onKeyStroke(
  's',
  onNonInputTarget(
    () => currentList.value && speakers.startSpeaker(currentList.value)
  )
)
onKeyStroke(
  'e',
  onNonInputTarget(
    () => currentList.value && speakers.stopSpeaker(currentList.value)
  )
)
/*
 * End navigation
 */

const speakerListSchema: FormSchema = createFormSchema(t, {
  properties: {
    title: {
      label: t('name'),
      type: 'string',
      minLength: 3
    }
  },
  required: ['title']
})

const nextSpeakerListName = computed(() =>
  agendaItem.value ? speakers.makeUniqueListName(agendaItem.value.title) : ''
)
async function addSpeakerList(data?: { title: string }) {
  if (!agendaItem.value) return
  const listData: SpeakerListAddMessage = {
    title: nextSpeakerListName.value, // Default / fallback value
    speaker_system: systemId.value,
    agenda_item: agendaItem.value.pk,
    ...data
  }
  await speakerListType.api.add(listData)
}
function createEditHandler(list: number) {
  return async (data: { title: string }) => {
    await speakerListType.api.patch(list, data)
  }
}

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

function addSpeaker(user: number) {
  if (!currentList.value) return
  speakers.moderatorEnterList(currentList.value, user)
}

async function deleteList(list: SpeakerList) {
  if (
    await dialogQuery({
      title: t('speaker.confirmListDeletion'),
      theme: ThemeColor.Warning
    })
  )
    await speakerListType.api.delete(list.pk)
}

function getListMenu(list: SpeakerList): MenuItem[] {
  if (canDeleteSpeakerList(list)) {
    return [
      {
        title: t('content.delete'),
        prependIcon: 'mdi-delete',
        async onClick() {
          await deleteList(list)
        },
        color: ThemeColor.Warning
      }
    ]
  }
  return []
}

const { hasParticipantNumbers, participantNumbers } =
  useParticipantNumbers(meetingId)
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
    else addSpeaker(user)
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

const speakerHistoryExpanded = ref(false)
const speakerHistoryExpandable = computed(
  () => speakerHistory.value.length > SPEAKER_HISTORY_CAP
)
const annotatedSpeakerHistory = computed(() => {
  const history = speakerHistoryExpanded.value
    ? speakerHistory.value
    : speakerHistory.value.slice(0, SPEAKER_HISTORY_CAP)
  return history.map(({ pk, user, seconds }) => {
    return {
      pk,
      user,
      seconds,
      time: durationToString(Duration.fromMillis(seconds * 1000))
    }
  })
})

function timeSpokenHandler(pk: number) {
  return (data: { seconds: number }) => {
    return speakerType.update(pk, data)
  }
}

async function deleteHistory(pk: number) {
  try {
    await speakerType.api.delete(pk)
  } catch {
    alert('^Could not delete spoken time entry')
  }
}
</script>

<style lang="sass">
div.speaker-lists
  .v-card
    overflow: visible
    z-index: unset

ol.speaker-queue
  margin-left: 1.2em
  li
    &.self
      font-weight: 700
</style>

<template>
  <v-row v-if="speakerSystem">
    <v-col cols="12" order-sm="1" sm="5" md="5" lg="4" class="speaker-lists">
      <div class="d-flex mb-3">
        <h2 class="flex-grow-1">
          {{ t('speaker.listChoices') }}
        </h2>
        <v-btn-group>
          <v-btn
            color="primary"
            :disabled="!canManageSystem"
            prepend-icon="mdi-plus"
            @click="addSpeakerList()"
            size="small"
          >
            {{ t('speaker.newList') }}
          </v-btn>
          <v-menu :text="t('speaker.addQuick')" location="bottom right">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                color="primary"
                :disabled="!canManageSystem"
                size="small"
              >
                <v-icon icon="mdi-chevron-down" />
              </v-btn>
            </template>
            <v-list>
              <DefaultDialog>
                <template #activator="{ props }">
                  <v-list-item
                    v-bind="props"
                    :title="t('speaker.addWithName')"
                  />
                </template>
                <template #default="{ close }">
                  <div class="d-flex mb-2">
                    <h2 class="flex-grow-1">
                      {{ t('speaker.newList') }}
                    </h2>
                    <v-btn
                      @click="close"
                      class="mt-n2 mr-n2"
                      icon="mdi-close"
                      size="small"
                      variant="text"
                    />
                  </div>
                  <SchemaForm
                    :schema="speakerListSchema"
                    :model-value="{ title: nextSpeakerListName }"
                    :handler="addSpeakerList"
                    @saved="close"
                  >
                    <template #buttons="{ disabled }">
                      <div class="text-right">
                        <v-btn @click="close" variant="text">
                          {{ t('cancel') }}
                        </v-btn>
                        <v-btn
                          color="primary"
                          :disabled="disabled"
                          type="submit"
                        >
                          {{ t('save') }}
                        </v-btn>
                      </div>
                    </template>
                  </SchemaForm>
                </template>
              </DefaultDialog>
            </v-list>
          </v-menu>
        </v-btn-group>
      </div>
      <v-item-group v-model="currentList">
        <v-item
          v-for="list in speakerLists"
          :key="list.pk"
          :value="list"
          v-slot="{ isSelected, toggle }"
        >
          <v-card
            :color="isSelected ? 'success' : undefined"
            class="mb-4"
            @click="toggle?.()"
          >
            <div class="d-flex">
              <v-card-title class="flex-grow-1 flex-shrink-1">
                {{ list.title }}
              </v-card-title>
              <DropdownMenu
                :items="getListMenu(list)"
                :show-transitions="canChangeSpeakerList(list)"
                :content-type="speakerListType"
                :object="list"
              >
                <template #top v-if="canManageSystem">
                  <DefaultDialog>
                    <template #activator="{ props }">
                      <v-list-item
                        v-bind="props"
                        prepend-icon="mdi-pencil"
                        :title="t('edit')"
                      />
                    </template>
                    <template #default="{ close }">
                      <div class="d-flex mb-2">
                        <h2 class="flex-grow-1">
                          {{ t('speaker.editList') }}
                        </h2>
                        <v-btn
                          @click="close"
                          class="mt-n2 mr-n2"
                          icon="mdi-close"
                          size="small"
                          variant="text"
                        />
                      </div>
                      <SchemaForm
                        :schema="speakerListSchema"
                        :model-value="{ title: list.title }"
                        :handler="createEditHandler(list.pk)"
                        @saved="close"
                      >
                        <template #buttons="{ disabled }">
                          <div class="text-right">
                            <v-btn @click="close" variant="text">
                              {{ t('cancel') }}
                            </v-btn>
                            <v-btn
                              color="primary"
                              :disabled="disabled"
                              type="submit"
                            >
                              {{ t('save') }}
                            </v-btn>
                          </div>
                        </template>
                      </SchemaForm>
                    </template>
                  </DefaultDialog>
                </template>
              </DropdownMenu>
            </div>
            <v-card-text>
              {{ t('speaker.speakerCount', list.queue.length) }}
            </v-card-text>
          </v-card>
        </v-item>
      </v-item-group>
      <div v-if="currentList && annotatedSpeakerHistory.length" class="mt-4">
        <h2>
          {{ t('speaker.history') }}
        </h2>
        <v-list bg-color="background">
          <v-list-item
            v-for="{ pk, seconds, time, user } in annotatedSpeakerHistory"
            :key="pk"
          >
            <template #prepend>
              <UserAvatar :pk="user" />
            </template>
            <v-list-item-title>
              <User :pk="user" userid />
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ time }}
            </v-list-item-subtitle>
            <template #append>
              <span class="btn-group d-flex flex-nowrap">
                <DefaultDialog :title="t('speaker.editSpeakerTime')">
                  <template #activator="{ props }">
                    <v-btn size="x-small" color="secondary" v-bind="props">
                      <v-icon icon="mdi-pencil" />
                    </v-btn>
                  </template>
                  <template #default="{ close }">
                    <SchemaForm
                      :schema="timeSpokenSchema"
                      :handler="timeSpokenHandler(pk)"
                      @saved="close"
                      :modelValue="{ seconds }"
                    >
                      <template #buttons>
                        <div class="text-right">
                          <v-btn type="submit" color="primary">
                            {{ t('save') }}
                          </v-btn>
                        </div>
                      </template>
                    </SchemaForm>
                  </template>
                </DefaultDialog>
                <QueryDialog
                  @confirmed="deleteHistory(pk)"
                  :text="t('speaker.confirmSpeakerDeletion')"
                  color="warning"
                >
                  <template #activator="{ props }">
                    <v-btn size="x-small" color="warning" v-bind="props">
                      <v-icon icon="mdi-delete" />
                    </v-btn>
                  </template>
                </QueryDialog>
              </span>
            </template>
          </v-list-item>
          <v-btn
            v-if="speakerHistoryExpandable"
            block
            variant="text"
            @click="speakerHistoryExpanded = !speakerHistoryExpanded"
            :append-icon="`mdi-chevron-${
              speakerHistoryExpanded ? 'up' : 'down'
            }`"
          >
            {{ speakerHistoryExpanded ? t('collapse') : t('expand') }}
          </v-btn>
        </v-list>
      </div>
    </v-col>
    <v-col cols="12" order-sm="0" sm="7" md="7" lg="6" offset-lg="1">
      <template v-if="currentList">
        <div class="btn-group mb-2">
          <v-btn
            color="primary"
            :disabled="!canStartSpeaker(currentList) || !speakerQueue.length"
            @click="speakers.startSpeaker(currentList)"
            ><v-icon icon="mdi-play"
          /></v-btn>
          <v-btn
            color="primary"
            :disabled="!currentSpeaker"
            @click="speakers.stopSpeaker(currentList)"
            ><v-icon icon="mdi-stop"
          /></v-btn>
          <v-btn
            color="primary"
            :disabled="!currentSpeaker"
            @click="speakers.undoSpeaker(currentList)"
            ><v-icon icon="mdi-undo"
          /></v-btn>
          <v-btn
            color="primary"
            :disabled="!speakerQueue.length"
            @click="speakers.shuffleList(currentList)"
            ><v-icon icon="mdi-shuffle-variant"
          /></v-btn>
        </div>
        <div class="d-flex" v-if="canManageSystem">
          <UserSearch
            :label="t('speaker.addByName')"
            :filter="userSearchFilter"
            @submit="addSpeaker"
            :params="userSearchParams"
            instant
            class="flex-grow-1"
          />
          <template v-if="hasParticipantNumbers">
            <div style="width: 10px"></div>
            <v-text-field
              :label="t('speaker.addByParticipantNumber')"
              class="mb-0 flex-grow-1"
              v-model="participantNumberInput"
              @keydown.enter="addParticipantNumbers()"
            />
          </template>
        </div>
        <p v-else>
          <em>{{ t('speaker.cantManageList') }}</em>
        </p>
        <v-sheet
          elevation="4"
          rounded="lg"
          v-if="currentSpeaker"
          class="my-4 pa-3"
        >
          <div class="d-flex mb-2 align-center">
            <UserAvatar :pk="currentSpeaker.user" class="mr-2" />
            <User :pk="currentSpeaker.user" style="font-size: 1.2rem" />
          </div>
          <p class="text-h3 text-right">
            <Moment in-seconds ordinary :date="currentSpeaker.started" />
          </p>
        </v-sheet>
        <v-list
          v-if="annotatedSpeakerQueue.length"
          density="comfortable"
          bg-color="background"
        >
          <template v-for="{ title, queue } in speakerGroups" :key="title">
            <v-list-subheader v-if="title" class="mt-3">
              {{ title }}
            </v-list-subheader>
            <v-list-item
              v-for="user in queue"
              :key="user"
              :class="{ self: isSelf(user) }"
            >
              <template #prepend>
                <UserAvatar :pk="user" />
              </template>
              <v-list-item-title class="flex-grow-1">
                <User :pk="user" />
              </v-list-item-title>
              <template #append>
                <span class="btn-group d-flex flex-nowrap">
                  <v-btn
                    color="primary"
                    :disabled="!canStartSpeaker(currentList)"
                    @click="speakers.startSpeaker(currentList, user)"
                    size="x-small"
                  >
                    <v-icon icon="mdi-play" />
                  </v-btn>
                  <v-btn
                    color="warning"
                    @click="speakers.moderatorLeaveList(currentList, user)"
                    size="x-small"
                  >
                    <v-icon icon="mdi-delete" />
                  </v-btn>
                </span>
              </template>
            </v-list-item>
          </template>
        </v-list>
        <p v-else>
          <em>{{ t('speaker.queueEmpty') }}</em>
        </p>
      </template>
      <p v-else>
        <em>{{ t('speaker.selectAIList') }}</em>
      </p>
    </v-col>
  </v-row>
</template>
