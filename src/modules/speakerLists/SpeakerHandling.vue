<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import { MenuItem, ThemeColor } from '@/utils/types'
import DefaultDialog from '@/components/DefaultDialog.vue'
import DropdownMenu from '@/components/DropdownMenu.vue'
import useErrorHandler from '@/composables/useErrorHandler'
import usePermission from '@/composables/usePermission'
import QueryDialog from '@/components/QueryDialog.vue'
import useRules from '@/composables/useRules'
import DefaultForm from '@/components/DefaultForm.vue'

import useAgendaItem from '../agendas/useAgendaItem'
import useMeeting from '../meetings/useMeeting'

import {
  canChangeSpeakerList,
  canDeleteSpeakerList,
  hasActiveSpeaker
} from './rules'
import { speakerListType } from './contentTypes'
import useSpeakerLists, { listApi } from './useSpeakerLists'
import useSpeakerSystem from './useSpeakerSystem'
import {
  SpeakerListState,
  type SpeakerList,
  type SpeakerListAddMessage
} from './types'
import SpeakerListControls from './SpeakerListControls.vue'
import SpeakerListHistory from './SpeakerListHistory.vue'

const props = defineProps<{
  room: number
}>()

const { t } = useI18n()

const { meetingId, meetingRoute } = useMeeting()
const { getUniqueListTitle } = useSpeakerLists(meetingId)
const { agendaId, agendaItem } = useAgendaItem()
const rules = useRules(t)

const {
  canManageSystem,
  speakerSystem,
  speakerLists,
  systemActiveList,
  setActiveList
} = useSpeakerSystem(
  computed(() => props.room),
  agendaId
)
const { getState } = speakerListType.useWorkflows()

const currentList = computed<SpeakerList | undefined>(() => {
  if (systemActiveList.value?.agenda_item !== agendaId.value) return
  return systemActiveList.value
})
const { handleRestError } = useErrorHandler({ target: 'dialog' })
usePermission(canManageSystem, { to: meetingRoute.value })

const nextSpeakerListName = computed(() =>
  agendaItem.value ? getUniqueListTitle(agendaItem.value.title) : ''
)

const speakerApi = speakerListType.getContentApi({ alertOnError: false })
async function addSpeakerList(data: { title: string }) {
  if (!agendaItem.value)
    throw new Error("No agenda item; can't add speaker list")
  if (!speakerSystem.value)
    throw new Error("No speaker system; can't add speaker list")
  const listData: SpeakerListAddMessage = {
    speaker_system: speakerSystem.value.pk,
    agenda_item: agendaItem.value.pk,
    ...data
  }
  await speakerApi.add(listData)
}
function updateSpeakerList(data: { title: string; pk: number }) {
  return speakerApi.patch(data.pk, { title: data.title })
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
  if (!speakerSystem.value)
    throw new Error("No speaker system; can't set active speaker list")
  const speakerActive = hasActiveSpeaker(speakerSystem.value)
  if (
    speakerActive &&
    !(await dialogQuery({
      title: t('speaker.confirmStopActiveSpeaker', {
        ...systemActiveList.value
      }),
      theme: ThemeColor.Warning
    }))
  )
    return
  try {
    await setActiveList(
      speakerSystem.value.pk,
      active ? list.pk : null,
      speakerActive
    )
  } catch (e) {
    handleRestError(e)
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
            size="small"
            :text="$t('speaker.newList')"
            @click="addSpeakerList({ title: nextSpeakerListName })"
          />
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
                  <DefaultForm
                    :model-value="{ title: nextSpeakerListName }"
                    :handler="addSpeakerList"
                    @done="close"
                    v-slot="{ errors, formData }"
                  >
                    <v-text-field
                      :label="$t('name')"
                      :error-messages="errors.title"
                      v-model="formData.title"
                      :rules="[rules.required, rules.minLength(3)]"
                    />
                  </DefaultForm>
                </template>
              </DefaultDialog>
            </v-list>
          </v-menu>
        </v-btn-group>
      </div>
      <v-sheet v-for="list in speakerLists" class="mb-4" elevation="4" rounded>
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
                    <DefaultForm
                      :model-value="{ title: list.title, pk: list.pk }"
                      :handler="updateSpeakerList"
                      @done="close"
                      v-slot="{ errors, formData }"
                    >
                      <v-text-field
                        :label="$t('name')"
                        :error-messages="errors.title"
                        v-model="formData.title"
                        :rules="[rules.required, rules.minLength(3)]"
                      />
                    </DefaultForm>
                  </template>
                </DefaultDialog>
                <QueryDialog
                  :text="$t('speaker.shuffleListConfirm')"
                  @confirmed="listApi.shuffle(list.pk)"
                >
                  <template #activator="{ props }">
                    <v-list-item
                      :disabled="!list.queue.length || !!list.current"
                      prepend-icon="mdi-shuffle-variant"
                      :title="$t('speaker.shuffleList')"
                      v-bind="props"
                    />
                  </template>
                </QueryDialog>
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
              v-if="list.isActive"
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
          v-if="list.isActive"
          class="bg-success-lighten-4 rounded-b px-3 py-1"
        >
          <v-icon icon="mdi-television-play" color="success" class="mr-2" />
          {{ $t('speaker.listActive') }}
        </div>
      </v-sheet>
      <SpeakerListHistory v-if="currentList" :list="currentList" class="mt-4" />
    </v-col>
    <v-col cols="12" order-sm="0" sm="7" md="7">
      <SpeakerListControls v-if="currentList" :list-id="currentList.pk" />
    </v-col>
  </v-row>
</template>

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
