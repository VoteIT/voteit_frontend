<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import HelpSection from '@/components/HelpSection.vue'
import DefaultDialog from '@/components/DefaultDialog.vue'

import useMeeting from '../meetings/useMeeting'
import type { JsonSchema } from '../forms/types'
import JsonSchemaForm from '../forms/JsonSchemaForm.vue'

import { roomType } from './contentTypes'
import { IMeetingRoom } from './types'
import { parseRestError } from '@/utils/restApi'
import useRooms from './useRooms'
import QueryDialog from '@/components/QueryDialog.vue'

const { t } = useI18n()
const { meetingId } = useMeeting()
const { meetingRooms } = useRooms(meetingId)

type EditData = Pick<IMeetingRoom, 'title' | 'sls'>

const schema: JsonSchema<EditData> = {
  properties: {
    title: {
      type: 'string',
      label: t('title'),
      maxLength: 100
    },
    sls: {
      type: 'number',
      label: t('speaker.system')
    }
  },
  required: ['title']
}

const errors = ref()
const working = ref(false)
/* Creation */
const createOpen = ref(false)
const createData = ref<EditData>({
  title: '',
  sls: null
})
async function create() {
  working.value = true
  try {
    await roomType.add({
      meeting: meetingId.value,
      ...createData.value
    })
    createOpen.value = false
  } catch (e) {
    errors.value = parseRestError(e)
  }
  working.value = false
}

/* Editing */
const editData = ref<EditData>({
  title: '',
  sls: null
})
function setEditData(data: IMeetingRoom) {
  errors.value = undefined
  const { title, sls } = data
  editData.value = { title, sls }
}
async function updateRoom(room: number, close: () => void) {
  working.value = true
  try {
    await roomType.update(room, { ...editData.value })
    close()
  } catch (e) {
    errors.value = parseRestError(e)
  }
  working.value = false
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
          <v-form @submit.prevent="create" v-slot="{ isValid }">
            <JsonSchemaForm
              :errors="errors"
              :schema="schema"
              v-model="createData"
              @changed="errors = undefined"
            />
            <div class="text-right">
              <v-btn variant="text" @click="close">
                {{ t('cancel') }}
              </v-btn>
              <v-btn
                type="submit"
                color="primary"
                :disabled="!isValid.value"
                :loading="working"
              >
                {{ t('room.create') }}
              </v-btn>
            </div>
          </v-form>
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
            {{ t('room.broadcasting') }}
          </th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="room in meetingRooms" :key="room.pk">
          <td>
            {{ room.title }}
          </td>
          <td>
            <v-icon v-if="room.active" icon="mdi-check" color="success" />
            <v-icon v-else icon="mdi-close" color="warning" />
          </td>
          <td class="text-right">
            <DefaultDialog @update:model-value="setEditData(room)">
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
                <v-form @submit.prevent="updateRoom(room.pk, close)">
                  <JsonSchemaForm
                    :errors="errors"
                    :schema="schema"
                    v-model="editData"
                  />
                  <div class="text-right">
                    <v-btn variant="text" @click="close">
                      {{ t('cancel') }}
                    </v-btn>
                    <v-btn color="primary" type="submit">
                      {{ t('save') }}
                    </v-btn>
                  </div>
                </v-form>
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
