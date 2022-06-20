<template>
  <v-row>
    <v-col cols="12" lg="10" offset-lg="1" v-if="agendaItem">
      <header>
        <div class="d-flex">
          <div class="btn-group navigation">
            <v-btn v-for="nav, i in navigation" :key="i" v-bind="nav" variant="text" size="small" />
          </div>
          <v-tabs v-if="speakerSystem && allSpeakerSystems.length > 1" class="mb-2 flex-grow-1" end>
            <v-tab v-for="{ pk, title, state } in allSpeakerSystems" :key="pk" :to="`${meetingPath}/lists/${pk}/${agendaItem.pk}`">
              {{ title }}
              <v-tooltip v-if="state === 'inactive'" :text="t('inactive')" location="top">
                <template #activator="{ props }">
                  <v-icon v-bind="props" end color="secondary" start>mdi-eye-off</v-icon>
                </template>
              </v-tooltip>
            </v-tab>
          </v-tabs>
        </div>
        <h1>
          {{ agendaItem.title }}
        </h1>
      </header>
    </v-col>
  </v-row>
  <v-row v-if="speakerSystem">
    <v-col cols="12" order-sm="1" sm="5" md="5" lg="4" class="speaker-lists">
      <h2>{{ t('speaker.listChoices') }}</h2>
      <v-item-group v-model="currentList">
        <v-item v-for="list in speakerLists" :key="list.pk" :value="list" v-slot="{ isSelected, toggle }">
          <v-card :color="isSelected ? 'success' : undefined" class="mb-4" @click="toggle()">
            <div class="d-flex">
              <v-card-title class="flex-grow-1">
                {{ list.title }}
              </v-card-title>
              <Menu :items="getListMenu(list)" :show-transitions="canChangeSpeakerList(list)" :content-type="speakerListType" :object="list" />
            </div>
            <v-card-text>
              {{ t('speaker.speakerCount', speakers.getQueue(list.pk).length) }}
            </v-card-text>
          </v-card>
        </v-item>
      </v-item-group>
      <v-btn prepend-icon="mdi-plus" color="primary" class="mt-2" size="small"
             @click="addSpeakerList(speakerSystem)" :disabled="!canManageSystem">
        {{ t('speaker.addListToSystem', speakerSystem ) }}
      </v-btn>
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
          <UserSearch :label="t('speaker.addByName')" :filter="userSearchFilter" @submit="addSpeaker" :params="{ meeting: meetingId }" instant small class="flex-grow-1" />
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
              <v-list-item-avatar class="mr-2">
                <UserAvatar :pk="user" />
              </v-list-item-avatar>
              <v-list-item-title class="flex-grow-1">
                <User :pk="user"/>
              </v-list-item-title>
              <span class="btn-group d-flex flex-nowrap">
                <v-btn color="primary" @click="speakers.startSpeaker(currentList, user)" size="x-small"><v-icon icon="mdi-play"/></v-btn>
                <v-btn color="warning" @click="speakers.moderatorLeaveList(currentList, user)" size="x-small"><v-icon icon="mdi-delete"/></v-btn>
              </span>
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

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import useAuthentication from '@/composables/useAuthentication'
import Moment from '@/components/Moment.vue'
import UserSearch from '@/components/UserSearch.vue'

import useAgenda from '../agendas/useAgenda'
import { AgendaItem } from '../agendas/types'
import useMeeting from '../meetings/useMeeting'
import { User } from '../organisations/types'
import useParticipantNumbers from '../participantNumbers/useParticipantNumbers'

import { MenuItem, ThemeColor } from '@/utils/types'
import useChannel from '@/composables/useChannel'
import { canActivateList, canChangeSpeakerList, canDeleteSpeakerList, canStartSpeaker, isSystemSpeaker } from './rules'
import { speakerListType } from './contentTypes'
import useSpeakerLists from './useSpeakerLists'
import useSpeakerList from './useSpeakerList'
import useSpeakerSystem from './useSpeakerSystem'
import { openAlertEvent } from '@/utils/events'
import useSpeakerSystems from './useSpeakerSystems'

import type { SpeakerList, SpeakerSystem, SpeakerListAddMessage } from './types'

interface AgendaNav {
  icon: string
  to?: string
  disabled: boolean,
  title?: string
}

export default defineComponent({
  components: {
    Moment,
    UserSearch
  },
  setup () {
    const { t } = useI18n()
    const route = useRoute()

    const { user } = useAuthentication()
    const speakers = useSpeakerLists()
    const { meetingId, meetingPath } = useMeeting()
    const { agendaId, agendaItem, getPreviousAgendaItem, getNextAgendaItem, agenda } = useAgenda(meetingId)
    useChannel('agenda_item', agendaId)
    const systemId = computed(() => Number(route.params.system))
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
    const { annotatedSpeakerQueue, currentSpeaker, speakerGroups, speakerQueue } = useSpeakerList(systemActiveListId)
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
        makeNavigation('mdi-page-first', agenda.value[0]),
        makeNavigation('mdi-chevron-left', getPreviousAgendaItem(agendaItem.value)),
        makeNavigation('mdi-chevron-right', getNextAgendaItem(agendaItem.value)),
        makeNavigation('mdi-page-last', agenda.value[agenda.value.length - 1])
      ]
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
    // Filter on users that are speakers but not already in queue
    function userSearchFilter (user: User): boolean {
      if (!speakerQueue.value || !speakerSystem.value) return false
      if (speakerQueue.value.includes(user.pk)) return false
      return !!isSystemSpeaker(speakerSystem.value, user.pk)
    }
    function addSpeaker (user: User | number) {
      if (!currentList.value) return
      if (typeof user === 'number') speakers.moderatorEnterList(currentList.value, user)
      else speakers.moderatorEnterList(currentList.value, user.pk)
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
          icon: 'mdi-delete',
          onClick: () => deleteList(list),
          color: ThemeColor.Warning
        }]
      }
      return []
    }

    const { participantNumbers } = useParticipantNumbers(meetingId)
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

    return {
      t,
      agendaItem,
      allSpeakerSystems,
      annotatedSpeakerQueue,
      canManageSystem,
      currentList,
      currentSpeaker,
      speakerGroups,
      speakerQueue,
      participantNumberInput,
      speakers,
      speakerSystem,
      speakerLists,
      speakerListType,
      meetingId,
      meetingPath,
      navigation,
      addParticipantNumbers,
      addSpeaker,
      addSpeakerList,
      canChangeSpeakerList,
      canStartSpeaker,
      isSelf,
      getListMenu,
      userSearchFilter,
      ...useParticipantNumbers(meetingId)
    }
  }
})
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
