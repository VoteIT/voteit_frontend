<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import { MenuItem, ThemeColor } from '@/utils/types'
import createFormSchema from '@/utils/createFormSchema'
import useChannel from '@/composables/useChannel'
import useLoader from '@/composables/useLoader'
import DefaultDialog from '@/components/DefaultDialog.vue'
import DropdownMenu from '@/components/DropdownMenu.vue'
import SchemaForm from '@/components/SchemaForm.vue'
import { FormSchema } from '@/components/types'

import useAgenda from '../agendas/useAgenda'
import useMeeting from '../meetings/useMeeting'

import {
  canActivateList,
  canChangeSpeakerList,
  canDeleteSpeakerList
} from './rules'
import { speakerListType } from './contentTypes'
import useSpeakerLists from './useSpeakerLists'
import useSpeakerSystem from './useSpeakerSystem'

import type { SpeakerList, SpeakerListAddMessage } from './types'
import usePermission from '@/composables/usePermission'
import SpeakerListControls from './SpeakerListControls.vue'
import SpeakerListHistory from './SpeakerListHistory.vue'

const props = defineProps<{
  systemId: number
}>()

const { t } = useI18n()

const { meetingId, meetingRoute } = useMeeting()
const { getUniqueListTitle } = useSpeakerLists(meetingId)
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
  setActiveList
} = useSpeakerSystem(systemId, agendaId)
const currentList = computed<SpeakerList | undefined>({
  get() {
    if (systemActiveList.value?.agenda_item !== agendaId.value) return
    return systemActiveList.value
  },
  async set(list?: SpeakerList) {
    if (!list) return
    if (canActivateList(list)) setActiveList(list)
    else if (
      await dialogQuery(t('speaker.confirmStopActiveSpeaker', { ...list }))
    )
      setActiveList(list, true)
  }
})
usePermission(canManageSystem, { to: meetingRoute.value })

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
  agendaItem.value ? getUniqueListTitle(agendaItem.value.title) : ''
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
    <v-col cols="12" order-sm="1" sm="5" md="5" class="speaker-lists">
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
      <SpeakerListHistory v-if="currentList" :list="currentList" class="mt-4" />
    </v-col>
    <v-col cols="12" order-sm="0" sm="7" md="7">
      <SpeakerListControls v-if="currentList" :list-id="currentList.pk" />
    </v-col>
  </v-row>
</template>
