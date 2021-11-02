<template>
  <v-row>
    <v-col cols="12" md="10" lg="8" offset-md="1" offset-lg="2" v-if="agendaItem">
      <header>
        <div v-if="speakerSystem && speakerSystems.length > 1" class="mb-2">
          <v-btn v-for="system in speakerSystems" color="accent" :variant="speakerSystem === system ? 'contained' : 'outlined'" :key="system.pk" :to="`${meetingPath}/lists/${system.pk}/${agendaItem.pk}`" class="mr-1">
            {{ system.title }}
          </v-btn>
        </div>
        <div class="btn-group navigation">
          <v-btn v-for="nav, i in navigation" :key="i" v-bind="nav" color="secondary" size="x-small" />
        </div>
        <h1>
          {{ agendaItem.title }}
        </h1>
      </header>
    </v-col>
  </v-row>
  <v-row v-if="speakerSystem">
    <v-col cols="12" order-sm="1" sm="5" md="4" lg="3" class="speaker-lists">
      <h2>{{ t('speaker.listChoices') }}</h2>
      <v-item-group v-model="currentList">
        <v-item v-for="list in speakerLists" :key="list.pk" :value="list" v-slot="{ isSelected, toggle }">
          <v-card :color="isSelected ? 'primary' : undefined" class="mb-2" @click="toggle()">
            <Menu float :items="getListMenu(list)" :show-transitions="canChangeSpeakerList(list)" :content-type="speakerListType" :object="list" />
            <v-card-title>
              {{ list.title }}
            </v-card-title>
            <v-card-text v-if="list.pk === currentList?.pk && currentSpeaker">
              {{ t('speaker.currentlySpeaking') }}: <strong><User :pk="currentSpeaker.userid" /></strong>
            </v-card-text>
            <v-card-text>
              {{ t('speaker.speakerCount', { count: speakers.getQueue(list).length }, speakers.getQueue(list).length) }}
            </v-card-text>
          </v-card>
        </v-item>
      </v-item-group>
      <v-btn prepend-icon="mdi-plus" color="primary" class="mt-2" size="small"
             @click="addSpeakerList(speakerSystem)" :disabled="speakerSystem.state !== 'active'">
        {{ t('speaker.addListToSystem', speakerSystem ) }}
      </v-btn>
    </v-col>
    <v-col cols="12" order-sm="0" sm="7" md="6" lg="5" offset-md="1" offset-lg="2">
      <template v-if="currentList">
        <template v-if="canStartSpeaker(currentList)">
          <div class="btn-group mb-2">
            <v-btn color="primary" :disabAled="!currentQueue.length" @click="speakers.startSpeaker(currentList)"><v-icon icon="mdi-play"/></v-btn>
            <v-btn color="primary" :disabled="!currentSpeaker" @click="speakers.stopSpeaker(currentList)"><v-icon icon="mdi-stop"/></v-btn>
            <v-btn color="primary" :disabled="!currentSpeaker" @click="speakers.undoSpeaker(currentList)"><v-icon icon="mdi-undo"/></v-btn>
            <v-btn color="primary" :disabled="!currentQueue.length" @click="speakers.shuffleList(currentList)"><v-icon icon="mdi-shuffle-variant"/></v-btn>
          </div>
          <UserSearch label="Add speaker" :omitIds="currentQueue" @submit="addSpeaker" />
        </template>
        <p v-else>
          <em>{{ t('speaker.cantManageList') }}</em>
        </p>
        <p v-if="currentSpeaker" class="mt-4">
          {{ t('speaker.currentlySpeaking') }}:
          <strong><User :pk="currentSpeaker.userid" /></strong> <Moment in-seconds :date="currentSpeaker.started" />
        </p>
        <h3 class="mt-4">{{ t('speaker.queue') }}</h3>
        <v-list v-if="currentQueue.length" density="comfortable">
          <v-list-item v-for="user in currentQueue" :key="user" :class="{ self: isSelf(user) }">
            <v-list-item-avatar class="mr-2">
              <UserAvatar :pk="user" />
            </v-list-item-avatar>
            <v-list-item-title class="flex-grow-1">
              <User :pk="user"/>
            </v-list-item-title>
            <span class="btn-group">
              <v-btn color="primary" @click="speakers.startSpeaker(currentList, user)" size="x-small"><v-icon icon="mdi-play"/></v-btn>
              <v-btn color="warning" @click="speakers.moderatorLeaveList(currentList, user)" size="x-small"><v-icon icon="mdi-delete"/></v-btn>
            </span>
          </v-list-item>
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
import { computed, defineComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import useAuthentication from '@/composables/useAuthentication'
import useSpeakerLists from '@/modules/speakerLists/useSpeakerLists'
import useAgenda from '@/modules/agendas/useAgenda'

import Moment from '@/components/Moment.vue'
import UserSearch from '@/components/UserSearch.vue'

import useMeeting from '@/modules/meetings/useMeeting'
import { User } from '@/modules/organisations/types'
import { SpeakerListAddMessage } from '@/contentTypes/messages'
import { MenuItem, ThemeColor } from '@/utils/types'
import { dialogQuery } from '@/utils'
import { AgendaItem } from '../agendas/types'
import { SpeakerList, SpeakerSystem } from './types'
import { canActivateList, canChangeSpeakerList, canDeleteSpeakerList, canStartSpeaker } from './rules'
import { speakerListType } from './contentTypes'
import useSpeakerSystem from './useSpeakerSystem'

interface AgendaNav {
  icon: string
  to?: string
  disabled: boolean
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
    const { agendaId, agendaItem, getPreviousAgendaItem, getNextAgendaItem, getAgenda } = useAgenda()
    const { meetingId, meetingPath } = useMeeting()
    const systemId = computed(() => Number(route.params.system))
    const { currentActiveList, speakerSystem } = useSpeakerSystem(systemId)
    const speakerSystems = computed(() => speakers.getSystems(meetingId.value, false, true))
    const speakerLists = computed(() => speakerSystem.value && agendaItem.value && speakers.getSystemSpeakerLists(speakerSystem.value, agendaItem.value))
    const currentList = computed<SpeakerList | undefined>({
      get () {
        if (currentActiveList.value?.agenda_item !== agendaId.value) return
        return currentActiveList.value
      },
      async set (list?: SpeakerList) {
        if (!list) return
        if (canActivateList(list)) speakers.setActiveList(list)
        else if (await dialogQuery(t('speaker.confirmStopActiveSpeaker', { ...list }))) speakers.setActiveList(list, true)
      }
    })
    const currentSpeaker = computed(() => currentList.value && speakers.getCurrent(currentList.value))
    const currentQueue = computed(() => currentList.value && speakers.getQueue(currentList.value))
    function isSelf (userId: number) {
      return user.value?.pk === userId
    }

    function makeNavigation (icon: string, toAgendaItem?: AgendaItem): AgendaNav {
      return {
        icon,
        to: toAgendaItem ? `${meetingPath.value}/lists/${systemId.value}/${toAgendaItem.pk}` : route.path, // Vuetify alpha.11 does not accept change to undef
        disabled: !toAgendaItem || toAgendaItem === agendaItem.value
      }
    }

    const navigation = computed<AgendaNav[]>(() => {
      if (!agendaItem.value) return []
      const agenda = getAgenda(meetingId.value)
      return [
        makeNavigation('mdi-page-first', agenda[0]),
        makeNavigation('mdi-chevron-left', getPreviousAgendaItem(agendaItem.value)),
        makeNavigation('mdi-chevron-right', getNextAgendaItem(agendaItem.value)),
        makeNavigation('mdi-page-last', agenda[agenda.length - 1])
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

    function addSpeaker (user: User) {
      if (!currentList.value) return
      speakers.moderatorEnterList(currentList.value, user.pk)
    }

    async function deleteList (list: SpeakerList) {
      if (await dialogQuery({
        title: t('speaker.confirmListDeletion'),
        theme: ThemeColor.Warning
      })) await speakerListType.api.delete(list.pk)
    }

    function getListMenu (list: SpeakerList): MenuItem[] {
      // const menu: MenuItem[] = []
      // if (canActivateList(list)) {
      //   menu.push({
      //     title: t('speaker.setActiveList'),
      //     icon: 'mdi-toggle-switch-off',
      //     onClick: async () => speakers.setActiveList(list)
      //   })
      // }
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

    return {
      t,
      agendaItem,
      currentList,
      currentSpeaker,
      currentQueue,
      speakers,
      speakerSystem,
      speakerSystems,
      speakerLists,
      speakerListType,
      meetingPath,
      navigation,
      addSpeaker,
      addSpeakerList,
      canChangeSpeakerList,
      canStartSpeaker,
      isSelf,
      getListMenu
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

.btn-group.navigation // Flat does not work in vuetify alpha.11
  .v-btn--variant-contained::before
    box-shadow: none !important
</style>
