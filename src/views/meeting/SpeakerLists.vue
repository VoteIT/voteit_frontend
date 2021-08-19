<template>
  <v-row>
    <v-col cols="12" md="10" lg="8" offset-md="1" offset-lg="2" v-if="agendaItem">
      <header>
        <div v-if="speakerSystem && speakerSystems.length > 1" class="mb-2">
          <v-btn v-for="system in speakerSystems" color="accent" :variant="speakerSystem === system ? 'contained' : 'outlined'" :key="system.pk" @click="$router.push(`${meetingPath}/lists/${system.pk}/${agendaItem.pk}`)" class="mr-1">
            {{ system.title }}
          </v-btn>
        </div>
        <div class="btn-group">
          <v-btn v-for="{ icon, disabled, action } in navigation" :key="icon"
                :disabled="disabled" color="secondary" elevation="0" size="x-small" :icon="icon"
                @click="action()" />
        </div>
        <h1>
          {{ agendaItem.title }}
        </h1>
      </header>
    </v-col>
  </v-row>
  <v-row v-if="speakerSystem">
    <v-col cols="12" order-sm="1" sm="5" md="4" lg="3">
      <h2>{{ t('speaker.listChoices') }}</h2>
      <v-item-group class="speaker-lists" v-model="currentList">
        <v-item v-for="list in speakerLists" :key="list.pk" :value="list" v-slot="{ isSelected, disabled }" :disabled="!!speakers.getSystemActiveSpeaker(speakerSystem)">
          <v-card :color="isSelected ? 'primary' : undefined" class="mb-2" :disabled="disabled && !isSelected">
            <Menu float :items="getListMenu(list)" :show-transitions="canChange(list)" :content-type="speakerListType" :object="list" />
            <v-card-title>
              {{ list.title }}
            </v-card-title>
            <v-card-text v-if="isSelected && currentSpeaker">
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
        <div v-if="canStart(currentList)" class="btn-group">
          <v-btn color="primary" :disabled="!currentQueue.length" @click="speakers.startSpeaker(currentList)"><v-icon icon="mdi-play"/></v-btn>
          <v-btn color="primary" :disabled="!currentSpeaker" @click="speakers.stopSpeaker(currentList)"><v-icon icon="mdi-stop"/></v-btn>
          <v-btn color="primary" :disabled="!currentSpeaker" @click="speakers.undoSpeaker(currentList)"><v-icon icon="mdi-undo"/></v-btn>
        </div>
        <p v-else>
          <em>{{ t('speaker.cantManageList') }}</em>
        </p>
        <p v-if="currentSpeaker" class="mt-4">
          {{ t('speaker.currentlySpeaking') }}:
          <strong><User :pk="currentSpeaker.userid" /></strong> <Moment in-seconds :date="currentSpeaker.started" />
        </p>
        <h3 class="mt-4">{{ t('speaker.queue') }}</h3>
        <ol v-if="currentQueue.length" class="speaker-queue">
          <li v-for="user in currentQueue" :key="user" :class="{ self: isSelf(user) }">
            <User :pk="user"/>
            <span class="btn-group ml-2">
              <v-btn color="primary" @click="speakers.startSpeaker(currentList, user)" size="x-small"><v-icon icon="mdi-play"/></v-btn>
              <v-btn color="warning" @click="speakers.moderatorLeaveList(currentList, user)" size="x-small"><v-icon icon="mdi-delete"/></v-btn>
            </span>
          </li>
        </ol>
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
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import useAuthentication from '@/composables/useAuthentication'
import useSpeakerLists from '@/composables/meeting/useSpeakerLists'
import useAgenda from '@/composables/meeting/useAgenda'

import Moment from '@/components/widgets/Moment.vue'

import speakerListType from '@/contentTypes/speakerList'
import useMeeting from '@/composables/meeting/useMeeting'
import { AgendaItem, SpeakerList } from '@/contentTypes/types'
import { SpeakerSystem } from '@/contentTypes/speakerSystem'
import { SpeakerListAddMessage } from '@/contentTypes/messages'
import { MenuItem, ThemeColor } from '@/utils/types'
import { dialogQuery } from '@/utils'

interface AgendaNav {
  icon: string
  action: () => void
  disabled: boolean
}

export default defineComponent({
  components: {
    Moment
  },
  setup () {
    const { t } = useI18n()
    const route = useRoute()
    const router = useRouter()

    const { user } = useAuthentication()
    const speakers = useSpeakerLists()
    const { agendaId, agendaItem, getPreviousAgendaItem, getNextAgendaItem, getAgenda } = useAgenda()
    const { meetingId, meetingPath } = useMeeting()
    const systemId = computed(() => Number(route.params.system))
    const speakerSystem = computed(() => speakers.getSystem(systemId.value))
    const speakerSystems = computed(() => speakers.getSystems(meetingId.value, false, true))
    const speakerLists = computed(() => speakerSystem.value && agendaItem.value && speakers.getSystemSpeakerLists(speakerSystem.value, agendaItem.value))
    const currentList = computed<SpeakerList | undefined>({
      // eslint-disable-next-line vue/return-in-computed-property
      get () {
        // eslint-disable-next-line camelcase
        if (!speakerSystem.value?.active_list) return
        const list = speakers.getList(speakerSystem.value.active_list)
        // eslint-disable-next-line camelcase
        if (list?.agenda_item === agendaId.value) return list
      },
      set (value) {
        if (!value) return
        speakers.setActiveList(value)
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
        action () { toAgendaItem && router.push(`${meetingPath.value}/lists/${systemId.value}/${toAgendaItem.pk}`) },
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
      speakerListType.getContentApi().add(listData)
    }

    async function deleteList (list: SpeakerList) {
      if (await dialogQuery({
        title: t('speaker.confirmListDeletion'),
        theme: ThemeColor.Warning
      })) await speakerListType.getContentApi().delete(list.pk)
    }

    function getListMenu (list: SpeakerList): MenuItem[] {
      const menu: MenuItem[] = []
      if (speakerListType.rules.canActivate(list)) {
        menu.push({
          text: t('speaker.setActiveList'),
          icon: 'mdi-toggle-switch-off',
          onClick: async () => speakers.setActiveList(list)
        })
      }
      if (speakerListType.rules.canDelete(list)) {
        menu.push({
          text: t('delete'),
          icon: 'mdi-delete',
          onClick: () => deleteList(list),
          color: ThemeColor.Warning
        })
      }
      return menu
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
      ...speakerListType.rules,
      isSelf,
      meetingPath,
      navigation,
      addSpeakerList,
      getListMenu
    }
  }
})
</script>

<style lang="sass">
div.speaker-lists
  .v-card
    overflow: visible

ol.speaker-queue
  margin-left: 1.2em
  li
    &.self
      font-weight: 700
</style>
