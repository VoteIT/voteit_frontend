<script setup lang="ts">
import { sortBy } from 'lodash'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ButtonWithDropdown from '@/components/ButtonWithDropdown.vue'
import HelpSection from '@/components/HelpSection.vue'
import DefaultDialog from '@/components/DefaultDialog.vue'
import QueryDialog from '@/components/QueryDialog.vue'
import RoleMatrix from '@/components/RoleMatrix.vue'
import UserSearch from '@/components/UserSearch.vue'

import { parseRestError } from '@/utils/restApi'
import { openDialogEvent } from '@/utils/events'
import { ThemeColor } from '@/utils/types'

import useAgenda from '../agendas/useAgenda'
import { translateMeetingRole } from '../meetings/utils'
import useMeetingId from '../meetings/useMeetingId'
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
import useRooms from './useRooms'
import useRoom from './useRoom'
import RoomForm from './RoomForm.vue'

const { t } = useI18n()
const meetingId = useMeetingId()
const { agenda } = useAgenda(meetingId)
const { meetingRooms } = useRooms(meetingId)
const { getRoomRoute } = useRoom()

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
        !!speakerSystem && speakerSystem.state === SpeakerSystemState.Archived,
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

async function deleteRoom(pk: number) {
  try {
    await roomType.delete(pk)
  } catch (e) {
    const err = parseRestError(e)
    openDialogEvent.emit({
      title: 'force' in err ? t('room.couldNotDelete') : t('error.unknown'),
      resolve() {},
      no: false,
      yes: t('ok'),
      theme: ThemeColor.Error
    })
  }
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
      <DefaultDialog v-model="createOpen" :title="t('room.create')">
        <template #activator="{ props }">
          <v-btn color="primary" prepend-icon="mdi-plus" v-bind="props">
            {{ t('room.create') }}
          </v-btn>
        </template>
        <template #default="{ close }">
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
              :to="
                getRoomRoute('room:broadcast', {
                  id: meetingId,
                  roomId: room.pk,
                  aid: room.agenda_item || agenda[0].pk,
                  tab: 'decisions'
                })
              "
            />
          </td>
          <td class="text-right">
            <DefaultDialog :title="t('room.edit')">
              <template #activator="{ props }">
                <ButtonWithDropdown
                  v-bind="props"
                  color="primary"
                  prepend-icon="mdi-pencil"
                  size="small"
                  :text="t('edit')"
                >
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
                            room.formData.speakerSystem
                              ?.meeting_roles_to_speaker.length
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
                      @confirmed="deleteRoom(room.pk)"
                    >
                      <template #activator="{ props }">
                        <v-list-item
                          base-color="warning"
                          :disabled="room.open"
                          v-bind="props"
                          prepend-icon="mdi-delete"
                        >
                          {{ t('content.delete') }}
                        </v-list-item>
                      </template>
                    </QueryDialog>
                  </v-list>
                </ButtonWithDropdown>
              </template>
              <template #default="{ close }">
                <RoomForm
                  :data="room.formData"
                  :sls-disabled="room.slsDisabled"
                  :working="working"
                  @cancel="close"
                  @submit="updateRoom(room, $event, close)"
                />
              </template>
            </DefaultDialog>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>
