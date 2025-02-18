<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import { MenuItem, ThemeColor } from '@/utils/types'
import createFormSchema from '@/utils/createFormSchema'
import DefaultDialog from '@/components/DefaultDialog.vue'
import DropdownMenu from '@/components/DropdownMenu.vue'
import SchemaForm from '@/components/SchemaForm.vue'
import { FormSchema } from '@/components/types'
import useErrorHandler from '@/composables/useErrorHandler'

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

import {
  SpeakerListState,
  type SpeakerList,
  type SpeakerListAddMessage
} from './types'
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

const {
  canManageSystem,
  speakerSystem,
  speakerLists,
  systemActiveList,
  setActiveList
} = useSpeakerSystem(systemId, agendaId)
const { getState } = speakerListType.useWorkflows()

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
const { handleSocketError, handleRestError } = useErrorHandler({
  target: 'dialog'
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

async function setActive(list: SpeakerList, active = true) {
  try {
    if (active) await setActiveList(list)
    else await speakerListType.methodCall('deactivate', { pk: list.pk })
  } catch (e) {
    handleSocketError(e)
  }
}

async function transitionList(list: SpeakerList, transition: 'close' | 'open') {
  try {
    await speakerListType.transitions.make(list, transition, t)
  } catch (e) {
    handleRestError(e)
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
    <v-col cols="12" order-sm="1" sm="5" md="5" class="speaker-lists">
      <div class="d-flex mb-3">
        <h2 class="flex-grow-1">
          {{ $t('speaker.listChoices') }}
        </h2>
        <v-btn-group>
          <v-btn
            color="primary"
            :disabled="!canManageSystem"
            prepend-icon="mdi-plus"
            @click="addSpeakerList()"
            size="small"
          >
            {{ $t('speaker.newList') }}
          </v-btn>
          <v-menu :text="$t('speaker.addQuick')" location="bottom right">
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
              <DefaultDialog :title="$t('speaker.newList')">
                <template #activator="{ props }">
                  <v-list-item
                    v-bind="props"
                    :title="$t('speaker.addWithName')"
                  />
                </template>
                <template #default="{ close }">
                  <SchemaForm
                    :schema="speakerListSchema"
                    :model-value="{ title: nextSpeakerListName }"
                    :handler="addSpeakerList"
                    @saved="close"
                  >
                    <template #buttons="{ disabled }">
                      <div class="text-right">
                        <v-btn @click="close" variant="text">
                          {{ $t('cancel') }}
                        </v-btn>
                        <v-btn
                          color="primary"
                          :disabled="disabled"
                          type="submit"
                        >
                          {{ $t('save') }}
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
      <v-item-group :model-value="currentList">
        <v-item
          v-for="list in speakerLists"
          :key="list.pk"
          :value="list"
          v-slot="{ isSelected }"
        >
          <v-sheet class="mb-4" elevation="4" rounded>
            <div class="pa-3">
              <div class="d-flex">
                <h3 class="flex-grow-1 flex-shrink-1">
                  {{ list.title }}
                  <small
                    :class="`text-${getState(list.state)?.color}`"
                    class="ml-2"
                  >
                    <v-icon
                      :icon="
                        list.state === SpeakerListState.Open
                          ? 'mdi-play-circle-outline'
                          : 'mdi-lock'
                      "
                      size="small"
                    />
                    &nbsp;{{ getState(list.state)?.getName(t) }}</small
                  >
                </h3>
                <DropdownMenu :items="getListMenu(list)" class="mt-n3 mr-n3">
                  <template #top v-if="canManageSystem">
                    <DefaultDialog :title="$t('speaker.editList')">
                      <template #activator="{ props }">
                        <v-list-item
                          v-bind="props"
                          prepend-icon="mdi-pencil"
                          :title="$t('edit')"
                        />
                      </template>
                      <template #default="{ close }">
                        <SchemaForm
                          :schema="speakerListSchema"
                          :model-value="{ title: list.title }"
                          :handler="createEditHandler(list.pk)"
                          @saved="close"
                        >
                          <template #buttons="{ disabled }">
                            <div class="text-right">
                              <v-btn @click="close" variant="text">
                                {{ $t('cancel') }}
                              </v-btn>
                              <v-btn
                                color="primary"
                                :disabled="disabled"
                                type="submit"
                              >
                                {{ $t('save') }}
                              </v-btn>
                            </div>
                          </template>
                        </SchemaForm>
                      </template>
                    </DefaultDialog>
                  </template>
                </DropdownMenu>
              </div>
              <p>
                {{ $t('speaker.speakerCount', list.queue.length) }}
              </p>
            </div>
            <template v-if="canChangeSpeakerList">
              <v-divider />
              <div class="px-3 py-1">
                <v-btn
                  v-if="isSelected"
                  @click="setActive(list, false)"
                  :text="$t('speaker.deactivateList')"
                  variant="text"
                  class="mr-1"
                />
                <v-btn
                  v-else
                  @click="setActive(list)"
                  :text="$t('speaker.activateList')"
                  variant="text"
                  class="mr-1"
                />
                <v-btn
                  v-if="list.state === SpeakerListState.Open"
                  @click="transitionList(list, 'close')"
                  :text="$t('speaker.closeList')"
                  class="mr-1"
                  variant="text"
                />
                <v-btn
                  v-else
                  @click="transitionList(list, 'open')"
                  :text="$t('speaker.openList')"
                  class="mr-1"
                  variant="text"
                />
              </div>
            </template>
            <div
              v-if="isSelected"
              class="bg-success-lighten-4 rounded-b px-3 py-1"
            >
              <v-icon icon="mdi-television-play" color="success" class="mr-2" />
              {{ $t('speaker.listActive') }}
            </div>
          </v-sheet>
        </v-item>
      </v-item-group>
      <SpeakerListHistory v-if="currentList" :list="currentList" class="mt-4" />
    </v-col>
    <v-col cols="12" order-sm="0" sm="7" md="7">
      <SpeakerListControls v-if="currentList" :list-id="currentList.pk" />
    </v-col>
  </v-row>
</template>
