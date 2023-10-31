<script setup lang="ts">
import { sortBy } from 'lodash'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import HelpSection from '@/components/HelpSection.vue'
import DefaultDialog from '@/components/DefaultDialog.vue'
import QueryDialog from '@/components/QueryDialog.vue'
import RoleMatrix from '@/components/RoleMatrix.vue'
import UserSearch from '@/components/UserSearch.vue'

import useMeeting from '../meetings/useMeeting'
import { IUser } from '../organisations/types'
import {
  SpeakerSystem,
  SpeakerSystemRole,
  SpeakerSystemState
} from '../speakerLists/types'
import { speakerSystemType } from '../speakerLists/contentTypes'
import useSpeakerLists from '../speakerLists/useSpeakerLists'

import { roomType } from './contentTypes'
import { IMeetingRoom } from './types'
import { parseRestError } from '@/utils/restApi'
import useRooms from './useRooms'
import RoomForm from './RoomForm.vue'
import useAgenda from '../agendas/useAgenda'

const { t } = useI18n()
const { meetingId } = useMeeting()
const { agenda } = useAgenda(meetingId)
const { meetingRooms } = useRooms(meetingId)

const { getSystem } = useSpeakerLists()
const { getUserIds } = speakerSystemType.useContextRoles()

interface FormData {
  room: Pick<IMeetingRoom, 'title'> & { speakers: boolean }
  speakerSystem?: Pick<
    SpeakerSystem,
    'method_name' | 'safe_positions' | 'settings' | 'meeting_roles_to_speaker'
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
    const sls = speakerSystem
      ? await createSpeakerSystem(speakerSystem)
      : undefined
    await roomType.add({
      meeting: meetingId.value,
      ...room,
      sls // Override with newly created
    })
    createOpen.value = false
  } catch (e) {
    errors.value = parseRestError(e)
  }
  working.value = false
}

async function updateRoom(
  { pk, sls }: IMeetingRoom,
  { room, speakerSystem }: FormData,
  close: () => void
) {
  working.value = true
  const systemState = sls && getSystem(sls)?.state
  const slsAdded = !sls && room.speakers
  const slsModified = !!sls && room.speakers
  const slsDisabled =
    !!sls && !room.speakers && systemState === SpeakerSystemState.Active
  const slsEnabled =
    !!sls && room.speakers && systemState === SpeakerSystemState.Inactive
  try {
    if (slsAdded) sls = await createSpeakerSystem(speakerSystem!)
    await roomType.update(pk, { ...room, sls })
    if (slsModified) await speakerSystemType.api.patch(sls!, speakerSystem!)
    if (slsDisabled) await speakerSystemType.api.transition(sls!, 'inactivate')
    if (slsEnabled) await speakerSystemType.api.transition(sls!, 'activate')
    close()
  } catch (e) {
    errors.value = parseRestError(e)
  }
  working.value = false
}

const editableMeetingRooms = computed(() =>
  sortBy(
    meetingRooms.value.map((r) => {
      const speakerSystem = r.sls ? getSystem(r.sls) : undefined
      const userIds = r.sls ? getUserIds(r.sls) : []
      return {
        ...r,
        formData: {
          room: {
            title: r.title,
            speakers: speakerSystem?.state === SpeakerSystemState.Active
          },
          speakerSystem
        },
        userSearch: {
          params: { meeting: meetingId.value },
          filter: ({ pk }: IUser) => !userIds.includes(pk),
          onSubmit: (user: number) =>
            speakerSystemType.addRoles(r.sls!, user, SpeakerSystemRole.Speaker)
        }
      }
    }),
    'title'
  )
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
            {{ t('speaker.lists', 2) }}
          </th>
          <th>
            {{ t('room.broadcasting') }}
          </th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="room in editableMeetingRooms" :key="room.pk">
          <td>
            {{ room.title }}
          </td>
          <td v-if="room.formData.room.speakers">
            <v-icon icon="mdi-check" color="success" />
            <DefaultDialog>
              <template #activator="{ props }">
                <v-btn
                  class="ml-2"
                  color="primary"
                  prepend-icon="mdi-account-group"
                  size="small"
                  v-bind="props"
                >
                  {{ t('speaker.handleRoles') }}
                </v-btn>
              </template>
              <template #default="{ close }">
                <div class="d-flex mb-2">
                  <h2 class="flex-grow-1">
                    {{ t('speaker.handleRoles') }}
                  </h2>
                  <v-btn
                    class="mt-n1 mr-n1"
                    icon="mdi-close"
                    size="small"
                    variant="text"
                    @click="close"
                  />
                </div>
                <RoleMatrix
                  admin
                  class="mb-4"
                  :content-type="speakerSystemType"
                  :icons="systemIcons"
                  :pk="room.sls!"
                />
                <UserSearch class="mb-2" v-bind="room.userSearch" />
              </template>
            </DefaultDialog>
          </td>
          <td v-else>
            <v-icon icon="mdi-close" color="warning" />
          </td>
          <td>
            <v-icon v-if="room.active" icon="mdi-check" color="success" />
            <v-icon v-else icon="mdi-close" color="warning" />
            <v-btn
              v-if="agenda.length"
              class="ml-2"
              color="primary"
              prepend-icon="mdi-broadcast"
              size="small"
              :to="{
                name: 'Plenary',
                params: {
                  id: meetingId,
                  roomId: room.pk,
                  tab: 'decisions',
                  aid: room.agenda_item || agenda[0].pk
                }
              }"
            >
              {{ t('plenary.view') }}
            </v-btn>
          </td>
          <td class="text-right">
            <DefaultDialog>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  class="mr-1"
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
                    size="small"
                    icon="mdi-close"
                    @click="close"
                    class="mt-n1 mr-n1"
                    variant="text"
                  />
                </div>
                <RoomForm
                  :data="room.formData"
                  :working="working"
                  @cancel="close"
                  @submit="updateRoom(room, $event, close)"
                />
              </template>
            </DefaultDialog>
            <QueryDialog
              :text="t('room.confirmDelete')"
              color="warning"
              @confirmed="roomType.delete(room.pk)"
            >
              <template #activator="{ props }">
                <v-btn
                  color="warning"
                  v-bind="props"
                  size="small"
                  prepend-icon="mdi-delete"
                >
                  {{ t('content.delete') }}
                </v-btn>
              </template>
            </QueryDialog>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>
