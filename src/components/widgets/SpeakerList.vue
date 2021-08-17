<template>
  <Widget :selected="isActive">
    <div class="btn-controls">
      <v-btn :prepend-icon="enterLeaveBtn.icon" v-if="enterLeaveBtn" :color="enterLeaveBtn.color" size="small" @click="enterLeaveBtn.action()">
        {{ enterLeaveBtn.title }}
      </v-btn>
      <Menu :items="menuItems" :show-transitions="canChange(list)" :content-type="speakerListType" :object="list" />
    </div>
    <h3>
      {{ list.title }}
    </h3>
    <p v-if="currentSpeaker" class="mb-2">
      {{ t('speaker.currentlySpeaking') }}:
      <strong><User :pk="currentSpeaker.userid" /></strong> <Moment in-seconds :date="currentSpeaker.started" />
    </p>
    <h4>{{ t('speaker.queue') }}</h4>
    <ol v-if="queue.length">
      <li v-for="userPk in queue" :key="userPk"><User :pk="userPk"/></li>
    </ol>
    <p v-else>
      <em>{{ t('speaker.queueEmpty') }}</em>
    </p>
  </Widget>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'

import useSpeakerLists from '../../composables/meeting/useSpeakerLists'
import rules from '@/contentTypes/speakerList/rules'

import speakerListType from '@/contentTypes/speakerList'
import { SpeakerList } from '@/contentTypes/types'
import { SpeakerListState } from '@/contentTypes/speakerList/workflowStates'
import Moment from './Moment.vue'
import { dialogQuery } from '@/utils'
import { MenuItem, ThemeColor } from '@/utils/types'
import { useI18n } from 'vue-i18n'

interface EnterLeaveBtn {
  icon: string
  title: string
  color?: string
  action: () => void
}

export default defineComponent({
  name: 'SpeakerList',
  props: {
    list: {
      type: Object as PropType<SpeakerList>,
      required: true
    }
  },
  components: {
    Moment
  },
  setup (props) {
    const { t } = useI18n()
    const speakers = useSpeakerLists()
    const api = speakerListType.getContentApi()

    const listSystem = computed(() => props.list && speakers.getSystem(props.list.speaker_system))
    const queue = computed(() => speakers.getQueue(props.list))
    const currentSpeaker = computed(() => speakers.getCurrent(props.list))
    const inList = computed(() => speakers.userInList(props.list))
    // eslint-disable-next-line camelcase
    const isActive = computed(() => listSystem.value?.active_list === props.list.pk)
    const isOpen = computed(() => props.list.state === SpeakerListState.Open)

    async function deleteList () {
      if (await dialogQuery({
        title: t('speaker.confirmListDeletion'),
        theme: ThemeColor.Warning
      })) await api.delete(props.list.pk)
    }

    const enterLeaveBtn = computed<EnterLeaveBtn | null>(() => {
      if (!inList.value && rules.canEnter(props.list)) {
        return {
          icon: 'mdi-playlist-plus',
          title: t('speaker.enterList'),
          color: 'primary',
          action: () => speakers.enterList(props.list)
        }
      }
      if (inList.value && rules.canLeave(props.list)) {
        return {
          icon: 'mdi-playlist-remove',
          title: t('speaker.leaveList'),
          color: 'warning',
          action: () => speakers.leaveList(props.list)
        }
      }
      return null
    })

    const menuItems = computed<MenuItem[]>(() => {
      const menu: MenuItem[] = []
      if (rules.canActivate(props.list)) {
        menu.push({
          text: t('speaker.setActiveList'),
          icon: 'mdi-toggle-switch-off',
          onClick: async () => speakers.setActiveList(props.list)
        })
      }
      if (rules.canDelete(props.list)) {
        menu.push({
          text: t('delete'),
          icon: 'mdi-delete',
          onClick: deleteList,
          color: ThemeColor.Warning
        })
      }
      return menu
    })

    return {
      deleteList,
      speakerListType,
      isActive,
      isOpen,
      queue,
      currentSpeaker,
      inList,
      enterLeaveBtn,
      menuItems,
      ...rules,
      speakers,
      t
    }
  }
})
</script>

<style lang="sass" scoped>
.btn-controls
  float: right

h3 .mdi
  cursor: pointer

ol
  padding-left: 1.5em
</style>
