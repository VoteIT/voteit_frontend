<script setup lang="ts">
import { sortBy } from 'lodash'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import HelpSection from '@/components/HelpSection.vue'
import DefaultDialog from '@/components/DefaultDialog.vue'
import QueryDialog from '@/components/QueryDialog.vue'
import RoleMatrix from '@/components/RoleMatrix.vue'
import UserSearch from '@/components/UserSearch.vue'

import useAgenda from '../agendas/useAgenda'
import useMeeting from '../meetings/useMeeting'
import { translateMeetingRole } from '../meetings/utils'
import { IUser } from '../organisations/types'
import {
  SpeakerSystem,
  SpeakerSystemRole,
  SpeakerSystemState
} from '../speakerLists/types'
import { speakerSystemType } from '../speakerLists/contentTypes'
import { findSpeakerSystem } from '../speakerLists/useSpeakerLists'

import { roomType } from './contentTypes'
import { IMeetingRoom } from './types'
import { parseRestError } from '@/utils/restApi'
import useRooms from './useRooms'
import RoomForm from './RoomForm.vue'

const { t } = useI18n()
const { meetingId } = useMeeting()
const { agenda } = useAgenda(meetingId)
const { meetingRooms } = useRooms(meetingId)

const { getUserIds } = speakerSystemType.useContextRoles()

interface FormData {
  room: Pick<IMeetingRoom, 'title'> & { speakers: boolean }
  speakerSystem?: Pick<
    SpeakerSystem,
    | 'method_name'
    | 'safe_positions'
    | 'settings'
    | 'meeting_roles_to_speaker'
    | 'show_time'
  >
}

const errors = ref()
const working = ref(false)
const createOpen = ref(false)

async function createSpeakerSystem(speakerSystem: Partial<SpeakerSystem>) {
  const { data } = await speakerSystemType.api.add({
    meeting: meetingId.value,
    ...speakerSystem
  })
  return data.pk
}

async function create({ room, speakerSystem }: FormData) {
  working.value = true
  try {
    const { data } = await roomType.api.add({
      meeting: meetingId.value,
      ...room
    })
    if (room.speakers)
      await speakerSystemType.api.add({
        room: data.pk,
        meeting: meetingId.value,
        ...speakerSystem
      })
    createOpen.value = false
  } catch (e) {
    errors.value = parseRestError(e)
  }
  working.value = false
}

function setOpen(room: number, open: boolean) {
  return roomType.update(room, { open })
}

async function updateRoom(
  { pk }: IMeetingRoom,
  { room, speakerSystem }: FormData,
  close: () => void
) {
  working.value = true
  const system = findSpeakerSystem((s) => s.room === pk)
  const slsAdded = !system && room.speakers
  const slsModified =
    !!system && room.speakers && system.state !== SpeakerSystemState.Archived
  const slsDisabled =
    !!system && !room.speakers && system.state === SpeakerSystemState.Active
  const slsEnabled =
    !!system && room.speakers && system.state === SpeakerSystemState.Inactive
  try {
    await roomType.update(pk, room)
    if (slsAdded) await createSpeakerSystem({ ...speakerSystem!, room: pk })
    if (slsModified)
      await speakerSystemType.api.patch(system.pk, speakerSystem!)
    if (slsDisabled)
      await speakerSystemType.transitions.make(system, 'inactivate', t)
    if (slsEnabled)
      await speakerSystemType.transitions.make(system, 'activate', t)
    close()
  } catch (e) {
    errors.value = parseRestError(e)
  }
  working.value = false
}

const editableMeetingRooms = computed(() =>
  sortBy(meetingRooms.value, 'title').map((r) => {
    const speakerSystem = findSpeakerSystem((s) => s.room === r.pk)
    const userIds = speakerSystem ? getUserIds(speakerSystem.pk) : []
    return {
      ...r,
      sls: speakerSystem?.pk,
      slsDisabled:
        !speakerSystem || speakerSystem.state === SpeakerSystemState.Archived,
      formData: {
        room: {
          title: r.title,
          speakers:
            !!speakerSystem &&
            speakerSystem.state !== SpeakerSystemState.Inactive
        },
        speakerSystem
      },
      userSearch: {
        params: { meeting: meetingId.value },
        filter: ({ pk }: IUser) => !userIds.includes(pk),
        onSubmit: (user: number) => {
          if (!speakerSystem)
            throw new Error("Can't add roles without speaker system")
          speakerSystemType.addRoles(
            speakerSystem.pk,
            user,
            SpeakerSystemRole.Speaker
          )
        }
      }
    }
  })
)

const systemIcons = {
  speaker: 'mdi-chat',
  list_moderator: 'mdi-gavel'
}
</script>

<template>
  <div>
    <HelpSection id="room.settings" class="mb-3">
      {{ t('room.settingsHelp') }}
    </HelpSection>
    <div class="d-flex mb-2">
      <h2 class="flex-grow-1">
        {{ t('room.settings') }}
      </h2>
      <DefaultDialog v-model="createOpen">
        <template #activator="{ props }">
          <v-btn color="primary" prepend-icon="mdi-plus" v-bind="props">
            {{ t('room.create') }}
          </v-btn>
        </template>
        <template #default="{ close }">
          <div class="d-flex mb-3">
            <h2 class="flex-grow-1">
              {{ t('room.create') }}
            </h2>
            <v-btn
              size="small"
              @click="close"
              icon="mdi-close"
              variant="text"
              class="mt-n1 mr-n1"
            />
          </div>
          <RoomForm :working="working" @submit="create" @cancel="close" />
        </template>
      </DefaultDialog>
    </div>
    <v-table>
      <thead>
        <tr>
          <th>
            {{ t('title') }}
          </th>
          <th>
            {{ t('room.open') }}
          </th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="room in editableMeetingRooms" :key="room.pk">
          <td>
            {{ room.title }}
          </td>
          <td>
            <v-btn
              @click="setOpen(room.pk, !room.open)"
              :color="room.open ? 'success' : 'warning'"
              variant="text"
            >
              <v-icon :icon="room.open ? 'mdi-check' : 'mdi-close'" />
            </v-btn>
            <v-btn
              v-if="agenda.length"
              class="ml-2"
              color="primary"
              prepend-icon="mdi-broadcast"
              size="small"
              variant="tonal"
              :text="t('room.toPlenaryView')"
              :to="{
                name: 'Plenary',
                params: {
                  id: meetingId,
                  roomId: room.pk,
                  tab: 'decisions',
                  aid: room.agenda_item || agenda[0].pk
                }
              }"
            />
          </td>
          <td class="text-right">
            <v-btn-group class="mr-1" density="compact">
              <DefaultDialog>
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    color="primary"
                    prepend-icon="mdi-pencil"
                    size="small"
                  >
                    {{ t('edit') }}
                  </v-btn>
                </template>
                <template #default="{ close }">
                  <div class="d-flex mb-2">
                    <h2 class="flex-grow-1">
                      {{ t('room.edit') }}
                    </h2>
                    <v-btn
                      icon="mdi-close"
                      @click="close"
                      class="mt-n1 mr-n1"
                      variant="text"
                    />
                  </div>
                  <RoomForm
                    :data="room.formData"
                    :sls-disabled="room.slsDisabled"
                    :working="working"
                    @cancel="close"
                    @submit="updateRoom(room, $event, close)"
                  />
                </template>
              </DefaultDialog>
              <v-menu location="bottom right">
                <template #activator="{ props }">
                  <v-btn v-bind="props" color="primary" class="px-0">
                    <v-icon icon="mdi-chevron-down" />
                  </v-btn>
                </template>
                <v-list>
                  <DefaultDialog
                    v-if="room.formData.room.speakers"
                    :title="t('speaker.handleRoles')"
                  >
                    <template #activator="{ props }">
                      <v-list-item
                        prepend-icon="mdi-account-group"
                        v-bind="props"
                      >
                        {{ t('speaker.handleRoles') }}
                      </v-list-item>
                    </template>
                    <p class="mb-3">
                      <i18n-t
                        keypath="speaker.handleRolesHelp"
                        :plural="
                          room.formData.speakerSystem?.meeting_roles_to_speaker
                            .length
                        "
                      >
                        <template #roles>
                          <strong>
                            {{
                              room.formData.speakerSystem?.meeting_roles_to_speaker
                                .map((r) => translateMeetingRole(r, t))
                                .join(', ')
                            }}
                          </strong>
                        </template>
                      </i18n-t>
                    </p>
                    <RoleMatrix
                      admin
                      class="mb-4"
                      :content-type="speakerSystemType"
                      :icons="systemIcons"
                      :pk="room.sls!"
                    />
                    <UserSearch class="mb-2" v-bind="room.userSearch" />
                  </DefaultDialog>
                  <QueryDialog
                    :text="t('room.confirmDelete')"
                    color="warning"
                    @confirmed="roomType.delete(room.pk)"
                  >
                    <template #activator="{ props }">
                      <v-list-item
                        base-color="warning"
                        :disabled="room.formData.room.speakers"
                        v-bind="props"
                        prepend-icon="mdi-delete"
                      >
                        {{ t('content.delete') }}
                      </v-list-item>
                    </template>
                  </QueryDialog>
                </v-list>
              </v-menu>
            </v-btn-group>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>
