<template>
  <Teleport to="#toolbar">
    <v-toolbar :title="agendaItem?.title" color="secondary-lighten-2" elevation="1" class="text-black">
      <div class="mr-2">
        <v-fade-transition>
          <v-btn v-if="activeListPath" :to="activeListPath" variant="tonal" class="d-none d-md-inline-flex mr-4">
            Aktiv talarlista
          </v-btn>
        </v-fade-transition>
        <v-btn v-for="nav, i in navigation" :key="i" v-bind="nav" color="black" />
      </div>
      <template #extension v-if="agendaItem && speakerSystem && allSpeakerSystems.length > 1">
        <v-tabs color="black" align-tabs="end" class="flex-grow-1">
          <v-tab v-for="{ pk, title, state } in allSpeakerSystems" :key="pk" :to="`${meetingPath}/lists/${pk}/${agendaItem.pk}`">
            {{ title }}
            <v-tooltip v-if="state === 'inactive'" :text="t('inactive')" location="top">
              <template #activator="{ props }">
                <v-icon v-bind="props" end color="secondary" start>mdi-eye-off</v-icon>
              </template>
            </v-tooltip>
          </v-tab>
        </v-tabs>
      </template>
    </v-toolbar>
  </Teleport>
  <v-row v-if="speakerSystem">
    <v-col cols="12" order-sm="1" sm="5" md="5" lg="4" class="speaker-lists">
      <h2>{{ t('speaker.listChoices') }}</h2>
      <v-item-group v-model="currentList">
        <v-item v-for="list in speakerLists" :key="list.pk" :value="list" v-slot="{ isSelected, toggle }">
          <v-card :color="isSelected ? 'success' : undefined" class="mb-4" @click="toggle()">
            <div class="d-flex">
              <v-card-title class="flex-grow-1 flex-shrink-1">
                {{ list.title }}
              </v-card-title>
              <DropdownMenu :items="getListMenu(list)" :show-transitions="canChangeSpeakerList(list)" :content-type="speakerListType" :object="list" />
            </div>
            <v-card-text>
              {{ t('speaker.speakerCount', list.queue.length) }}
            </v-card-text>
          </v-card>
        </v-item>
      </v-item-group>
      <v-btn prepend-icon="mdi-plus" color="primary" class="mt-2" size="small"
             @click="addSpeakerList(speakerSystem)" :disabled="!canManageSystem">
        {{ t('speaker.addListToSystem', speakerSystem) }}
      </v-btn>
      <div v-if="currentList && annotatedSpeakerHistory.length" class="mt-4">
        <h2>
          {{ t('speaker.history') }}
        </h2>
        <v-list bg-color="background">
          <v-list-item v-for="{ pk, seconds, time, user } in annotatedSpeakerHistory" :key="pk">
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
                    <SchemaForm :schema="timeSpokenSchema" :handler="timeSpokenHandler(pk)" @saved="close" :modelValue="{ seconds }">
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
                <QueryDialog @confirmed="deleteHistory(pk)" :text="t('speaker.confirmSpeakerDeletion')" color="warning">
                  <template #activator="{ props }">
                    <v-btn size="x-small" color="warning" v-bind="props">
                      <v-icon icon="mdi-delete" />
                    </v-btn>
                  </template>
                </QueryDialog>
              </span>
            </template>
          </v-list-item>
          <v-btn v-if="speakerHistoryExpandable" block variant="text" @click="speakerHistoryExpanded = !speakerHistoryExpanded" :append-icon="`mdi-chevron-${speakerHistoryExpanded ? 'up' : 'down'}`">
            {{ speakerHistoryExpanded ? t('collapse') : t('expand') }}
          </v-btn>
        </v-list>
      </div>
    </v-col>
    <v-col cols="12" order-sm="0" sm="7" md="7" lg="6" offset-lg="1">
      <template v-if="currentList">
        <div class="btn-group mb-2">
          <v-btn color="primary" :disabled="!canStartSpeaker(currentList) || !speakerQueue.length" @click="speakers.startSpeaker(currentList)"><v-icon icon="mdi-play"/></v-btn>
          <v-btn color="primary" :disabled="!currentSpeaker" @click="speakers.stopSpeaker(currentList)"><v-icon icon="mdi-stop"/></v-btn>
          <v-btn color="primary" :disabled="!currentSpeaker" @click="speakers.undoSpeaker(currentList)"><v-icon icon="mdi-undo"/></v-btn>
          <v-btn color="primary" :disabled="!speakerQueue.length" @click="speakers.shuffleList(currentList)"><v-icon icon="mdi-shuffle-variant"/></v-btn>
        </div>
        <div class="d-flex" v-if="canManageSystem">
          <UserSearch :label="t('speaker.addByName')" :filter="userSearchFilter" @submit="addSpeaker" :params="userSearchParams" instant small class="flex-grow-1" />
          <template v-if="hasParticipantNumbers">
            <div style="width: 10px;" />
            <v-text-field :label="t('speaker.addByParticipantNumber')" class="mb-0 flex-grow-1" v-model="participantNumberInput" @keydown.enter="addParticipantNumbers()" />
          </template>
        </div>
        <p v-else>
          <em>{{ t('speaker.cantManageList') }}</em>
        </p>
        <v-sheet elevation="4" rounded="lg" v-if="currentSpeaker" class="my-4 pa-3">
          <div class="d-flex mb-2 align-center">
            <UserAvatar :pk="currentSpeaker.user" class="mr-2" />
            <User :pk="currentSpeaker.user" style="font-size: 1.2rem;" />
          </div>
          <p class="text-h3 text-right">
            <Moment in-seconds ordinary :date="currentSpeaker.started" />
          </p>
        </v-sheet>
        <v-list v-if="annotatedSpeakerQueue.length" density="comfortable" bg-color="background">
          <template v-for="{ title, queue } in speakerGroups" :key="title">
            <v-list-subheader v-if="title" class="mt-3">
              {{ title }}
            </v-list-subheader>
            <v-list-item v-for="user in queue" :key="user" :class="{ self: isSelf(user) }">
              <template #prepend>
                <UserAvatar :pk="user" />
              </template>
              <v-list-item-title class="flex-grow-1">
                <User :pk="user"/>
              </v-list-item-title>
              <template #append>
                <span class="btn-group d-flex flex-nowrap">
                  <v-btn color="primary" :disabled="!canStartSpeaker(currentList)" @click="speakers.startSpeaker(currentList, user)" size="x-small">
                    <v-icon icon="mdi-play"/>
                  </v-btn>
                  <v-btn color="warning" @click="speakers.moderatorLeaveList(currentList, user)" size="x-small">
                    <v-icon icon="mdi-delete"/>
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

<script lang="ts" setup>
import { duration } from 'moment'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { dialogQuery, durationToString } from '@/utils'
import { MenuItem, ThemeColor } from '@/utils/types'
import useChannel from '@/composables/useChannel'
import useLoader from '@/composables/useLoader'
import useAlert from '@/composables/useAlert'
import DefaultDialog from '@/components/DefaultDialog.vue'
import QueryDialog from '@/components/QueryDialog.vue'
import useAuthentication from '@/composables/useAuthentication'
import Moment from '@/components/Moment.vue'
import SchemaForm from '@/components/SchemaForm.vue'
import UserSearch from '@/components/UserSearch.vue'
import { FieldType, FormSchema } from '@/components/types'

import useAgenda from '../agendas/useAgenda'
import { AgendaItem } from '../agendas/types'
import useMeeting from '../meetings/useMeeting'
import useParticipantNumbers from '../participantNumbers/useParticipantNumbers'
import type { User } from '../organisations/types'

import { canActivateList, canChangeSpeakerList, canDeleteSpeakerList, canStartSpeaker } from './rules'
import { speakerType, speakerListType } from './contentTypes'
import useSpeakerLists from './useSpeakerLists'
import useSpeakerList from './useSpeakerList'
import useSpeakerSystem from './useSpeakerSystem'
import { openAlertEvent } from '@/utils/events'
import useSpeakerSystems from './useSpeakerSystems'

import type { SpeakerList, SpeakerSystem, SpeakerListAddMessage } from './types'

const SPEAKER_HISTORY_CAP = 3

const timeSpokenSchema: FormSchema = [
  {
    label: 'Time spoken',
    name: 'seconds',
    type: FieldType.Duration
  }
]

interface AgendaNav {
  icon: string
  to?: string
  disabled: boolean,
  title?: string
}

const { t } = useI18n()
const route = useRoute()
const { alert } = useAlert()

const { user } = useAuthentication()
const speakers = useSpeakerLists()
const { meetingId, meetingPath } = useMeeting()
const { agendaId, agendaItem, getPreviousAgendaItem, getNextAgendaItem } = useAgenda(meetingId)
const systemId = computed(() => Number(route.params.system))
useLoader(
  'SpeakerListsView',
  useChannel('agenda_item', agendaId),
  useChannel('sls', systemId)
)
const { canManageSystem, speakerSystem, speakerLists, systemActiveList, systemActiveListId } = useSpeakerSystem(systemId, agendaId)
const { allSpeakerSystems } = useSpeakerSystems(meetingId)
const currentList = computed<SpeakerList | undefined>({
  get () {
    if (systemActiveList.value?.agenda_item !== agendaId.value) return
    return systemActiveList.value
  },
  async set (list?: SpeakerList) {
    if (!list) return
    if (canActivateList(list)) speakers.setActiveList(list)
    else if (await dialogQuery(t('speaker.confirmStopActiveSpeaker', { ...list }))) speakers.setActiveList(list, true)
  }
})
const { annotatedSpeakerQueue, currentSpeaker, speakerGroups, speakerHistory, speakerQueue } = useSpeakerList(systemActiveListId)
function isSelf (userId: number) {
  return user.value?.pk === userId
}

function makeNavigation (icon: string, toAgendaItem?: AgendaItem): AgendaNav {
  return {
    icon,
    to: toAgendaItem ? `${meetingPath.value}/lists/${systemId.value}/${toAgendaItem.pk}` : route.path, // Vuetify alpha.11 does not accept change to undef
    disabled: !toAgendaItem || toAgendaItem === agendaItem.value,
    title: toAgendaItem?.title
  }
}

const navigation = computed<AgendaNav[]>(() => {
  if (!agendaItem.value) return []
  return [
    // makeNavigation('mdi-page-first', agenda.value[0]),
    makeNavigation('mdi-chevron-left', getPreviousAgendaItem(agendaItem.value)),
    makeNavigation('mdi-chevron-right', getNextAgendaItem(agendaItem.value))
    // makeNavigation('mdi-page-last', agenda.value[agenda.value.length - 1])
  ]
})

// Link to handle Agenda Item with current active list
const activeListPath = computed(() => {
  const ai = systemActiveList.value?.agenda_item
  if (!ai || ai === agendaId.value) return // Only if not current
  return `${meetingPath.value}/lists/${systemId.value}/${ai}`
})

function addSpeakerList (system: SpeakerSystem) {
  if (!agendaItem.value) return
  const listData: SpeakerListAddMessage = {
    title: speakers.makeUniqueListName(agendaItem.value.title),
    speaker_system: system.pk,
    agenda_item: agendaItem.value.pk
  }
  speakerListType.api.add(listData)
}

// For user search
const userSearchParams = computed(() => {
  return {
    meeting: meetingId.value,
    any_roles: speakerSystem.value?.meeting_roles_to_speaker.join(',')
  }
})
// Filter on users that are speakers but not already in queue
function userSearchFilter (user: User): boolean {
  if (!speakerQueue.value || !speakerSystem.value) return false
  return !speakerQueue.value.includes(user.pk)
}

function addSpeaker (user: number) {
  if (!currentList.value) return
  speakers.moderatorEnterList(currentList.value, user)
}

async function deleteList (list: SpeakerList) {
  if (await dialogQuery({
    title: t('speaker.confirmListDeletion'),
    theme: ThemeColor.Warning
  })) await speakerListType.api.delete(list.pk)
}

function getListMenu (list: SpeakerList): MenuItem[] {
  if (canDeleteSpeakerList(list)) {
    return [{
      title: t('delete'),
      prependIcon: 'mdi-delete',
      onClick: () => deleteList(list),
      color: ThemeColor.Warning
    }]
  }
  return []
}

const { hasParticipantNumbers, participantNumbers } = useParticipantNumbers(meetingId)
const participantNumberInput = ref('')
async function addParticipantNumbers () {
  const numbers = participantNumberInput.value.split(/[^\d]+/).filter(n => n).map(Number)
  const inList: number[] = []
  const missing: number[] = []
  for (const n of numbers) {
    const user = participantNumbers.value.find(pn => pn.number === n)?.user
    if (!user) missing.push(n)
    else if (speakerQueue.value?.includes(user)) inList.push(n)
    else addSpeaker(user)
  }
  if (missing.length) openAlertEvent.emit('*' + t('participantNumber.doesNotExist', { ids: missing.join(', ') }, missing.length))
  if (inList.length) openAlertEvent.emit('*' + t('participantNumber.alreadyInList', { ids: inList.join(', ') }, inList.length))
  participantNumberInput.value = ''
}

const speakerHistoryExpanded = ref(false)
const speakerHistoryExpandable = computed(() => speakerHistory.value.length > SPEAKER_HISTORY_CAP)
const annotatedSpeakerHistory = computed(() => {
  const history = speakerHistoryExpanded.value
    ? speakerHistory.value
    : speakerHistory.value.slice(0, SPEAKER_HISTORY_CAP)
  return history.map(({ pk, user, seconds }) => {
    return {
      pk,
      user,
      seconds,
      time: durationToString(duration({ seconds }))
    }
  })
})

function timeSpokenHandler (pk: number) {
  return (data: { seconds: number }) => {
    return speakerType.update(pk, data)
  }
}

async function deleteHistory (pk: number) {
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
