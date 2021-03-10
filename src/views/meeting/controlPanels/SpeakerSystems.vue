<template>
  <div>
    <h2>{{ t('speaker.settings') }}</h2>
    <div class="widget speaker-system" v-for="system in systems" :key="system.pk">
      <div class="btn-controls float">
        <WorkflowState admin :contentType="speakerSystemType" :pk="system.pk" :state="system.state" />
        <btn sm v-if="systemRules.canDelete(system)" icon="delete" @click="deleteSystem(system)"/>
      </div>
      <h2>{{ system.title }}</h2>
      <dl>
        <dt>{{ t('speaker.visible') }}</dt>
        <dd>{{ system.active }}</dd>
        <dt>{{ t('speaker.systemMethod') }}</dt>
        <dd>{{ system.method_name }}</dd>
        <dt>{{ t('speaker.safePositions') }}</dt>
        <dd>{{ system.safe_positions || t('speaker.noSafePositions') }}</dd>
      </dl>
      <BtnDropdown dark :title="t('speaker.systemManage')" lazy>
        <RoleMatrix :channel="systemChannel" :pk="system.pk" :icons="systemIcons" />
        <UserSearch @submit="addUser(system, $event)"/>
      </BtnDropdown>
    </div>
    <BtnDropdown :title="t('speaker.systemAdd')">
      <form @submit.prevent="createSystem()">
        <p>
          <label for="speakersystem-title">{{ t('title') }}</label><br/>
          <input id="speakersystem-title" type="text" v-model="systemData.title">
        </p>
        <p>
          <label for="speakersystem-method">{{ t('speaker.systemMethod') }}</label><br/>
          <select id="speakersystem-method" v-model="systemData.method_name">
            <option v-for="[name, value] in Object.entries(SpeakerSystemMethod)" :key="value" :value="value">{{ name }}</option>
          </select>
        </p>
        <p>
          <label for="speakersystem-safepos">{{ t('speaker.safePositions') }}</label><br/>
          <input id="speakersystem-safepos" type="number" min="0" max="2" v-model="systemData.safe_positions">
        </p>
        <p>
          <input id="speakersystem-active" type="checkbox" v-model="systemData.active">
          <label for="speakersystem-active">{{ t('speaker.visible') }}</label>
        </p>
        <Btn icon="add" :disabled="!systemDataReady">{{ t('add') }}</Btn>
      </form>
    </BtnDropdown>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, onBeforeMount, reactive, ref } from 'vue'

import { dialogQuery, slugify } from '@/utils'
import useMeeting from '@/composables/meeting/useMeeting'
import useSpeakerLists from '@/composables/meeting/useSpeakerLists'

import BtnDropdown from '@/components/BtnDropdown.vue'
import UserSearch from '@/components/widgets/UserSearch.vue'
import RoleMatrix from '@/components/RoleMatrix.vue'

import speakerSystemType from '@/contentTypes/speakerSystem'
import { SpeakerSystem, SpeakerSystemMethod } from '@/contentTypes/types'
import useLoader from '@/composables/useLoader'
import { ContextRole } from '@/composables/types'
import { User } from '@/utils/types'
import WorkflowState from '@/components/widgets/WorkflowState.vue'

const systemIcons = {
  speaker: 'chat',
  list_moderator: 'gavel'
}

export default defineComponent({
  components: { BtnDropdown, UserSearch, RoleMatrix, WorkflowState },
  name: 'SpeakerSystems',
  path: 'speakers',
  icon: 'volume_up',
  setup () {
    const t = inject('t') as CallableFunction
    const systemAPI = speakerSystemType.getContentApi()
    const systemChannel = speakerSystemType.getChannel()
    const { meetingId, meeting } = useMeeting()
    const speakerLists = useSpeakerLists()
    const loader = useLoader('SpeakerSystems panel')
    const systemRoles = ref<ContextRole[]>([])

    onBeforeMount(() => {
      loader.call(() => {
        return systemChannel.getAvailableRoles()
          .then(roles => {
            systemRoles.value = roles
          })
      })
    })

    const systems = computed(() => speakerLists.getSystems(meetingId.value, true))
    const systemData = reactive({
      title: meeting.value ? slugify(meeting.value.title) : '',
      method_name: undefined,
      safe_positions: 1,
      active: true
    })
    const systemDataReady = computed(() => systemData.title && systemData.method_name)
    function createSystem () {
      if (systemDataReady.value) {
        systemAPI.add({ ...systemData, meeting: meetingId.value })
          .then(console.log, console.error)
      }
    }

    function deleteSystem (system: SpeakerSystem) {
      dialogQuery(t('speakerList.confirmSystemDeletion'))
        .then(() => systemAPI.delete(system.pk))
    }

    function addUser (system: SpeakerSystem, user: User) {
      systemChannel.addRoles(system.pk, user.pk, 'speaker') // TODO enumerate speaker system roles
    }

    return {
      t,
      systems,
      SpeakerSystemMethod,
      systemData,
      systemDataReady,
      createSystem,
      deleteSystem,
      systemChannel,
      addUser,
      systemRoles,
      meeting,
      systemRules: speakerSystemType.rules,
      speakerSystemType,
      systemIcons
    }
  }
})
</script>

<style lang="sass" scoped>
.btn-controls.float
  float: right
</style>
