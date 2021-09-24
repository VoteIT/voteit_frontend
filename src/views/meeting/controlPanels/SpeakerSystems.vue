<template>
  <div>
    <h2>{{ t('speaker.settings') }}</h2>
    <Widget class="speaker-system" v-for="system in systems" :key="system.pk">
      <Menu float :items="getSystemMenu(system)" show-transitions :content-type="speakerSystemType" :object="system"/>
      <h2>{{ system.title }}</h2>
      <dl>
        <dt>{{ t('state') }}</dt>
        <dd>{{ system.state }}</dd>
        <dt>{{ t('speaker.systemMethod') }}</dt>
        <dd>{{ system.method_name }}</dd>
        <dt>{{ t('speaker.safePositions') }}</dt>
        <dd>{{ system.safe_positions || t('speaker.noSafePositions') }}</dd>
      </dl>
      <UserSearch class="mt-4" @submit="addUser(system, $event)" :omitIds="getUserIds(system.pk)" />
      <RoleMatrix class="mt-2" admin :channel="systemChannel" :pk="system.pk" :icons="systemIcons" />
    </Widget>
    <BtnDropdown :title="t('speaker.systemAdd')">
      <form @submit.prevent="createSystem()">
        <p>
          <label for="speakersystem-title">{{ t('title') }}</label>
          <input id="speakersystem-title" type="text" v-model="systemData.title">
        </p>
        <p>
          <label for="speakersystem-method">{{ t('speaker.systemMethod') }}</label>
          <SelectVue required v-model="systemData.method_name" :options="SpeakerSystemMethod" />
        </p>
        <p>
          <label for="speakersystem-safepos">{{ t('speaker.safePositions') }}</label>
          <input id="speakersystem-safepos" type="number" min="0" max="2" v-model="systemData.safe_positions">
        </p>
        <Btn icon="mdi-plus" @click="createSystem()" :disabled="!systemDataReady">{{ t('add') }}</Btn>
      </form>
    </BtnDropdown>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'

import useLoader from '@/composables/useLoader'
import useMeeting from '@/modules/meetings/useMeeting'
import useSpeakerLists from '@/modules/speakerLists/useSpeakerLists'

import BtnDropdown from '@/components/BtnDropdown.vue'
import UserSearch from '@/components/UserSearch.vue'
import RoleMatrix from '@/components/RoleMatrix.vue'

import speakerSystemType, { SpeakerSystem, SpeakerSystemMethod } from '@/contentTypes/speakerSystem'
import { ContextRole } from '@/composables/types'
import { MenuItem, ThemeColor } from '@/utils/types'

import SelectVue from '@/components/inputs/Select.vue'
import { User } from '@/contentTypes/types'

const systemIcons = {
  speaker: 'mdi-chat',
  list_moderator: 'mdi-gavel'
}

export default defineComponent({
  components: {
    BtnDropdown,
    UserSearch,
    RoleMatrix,
    SelectVue
  },
  name: 'SpeakerSystems',
  path: 'speakers',
  icon: 'mdi-account-voice',
  setup () {
    const { t } = useI18n()
    const systemAPI = speakerSystemType.getContentApi()
    const systemChannel = speakerSystemType.getChannel()
    const { meetingId, meeting } = useMeeting()
    const speakerLists = useSpeakerLists()
    const loader = useLoader('SpeakerSystems panel')
    const systemRoles = ref<ContextRole[]>([])
    const { getUserIds } = speakerSystemType.useContextRoles()

    onBeforeMount(() => {
      loader.call(async () => {
        systemRoles.value = await systemChannel.getAvailableRoles()
      })
    })

    const systems = computed(() => speakerLists.getSystems(meetingId.value, true))
    const systemData = reactive<Partial<SpeakerSystem>>({
      title: t('speaker.system'),
      safe_positions: 1
    })
    const systemDataReady = computed(() => systemData.title && systemData.method_name)

    function createSystem () {
      if (systemDataReady.value) {
        systemAPI.add({ ...systemData, meeting: meetingId.value })
          .then(console.log, console.error)
      }
    }

    async function deleteSystem (system: SpeakerSystem) {
      if (await dialogQuery({
        title: t('speaker.confirmSystemDeletion'),
        theme: ThemeColor.Warning
      })) systemAPI.delete(system.pk)
    }

    function addUser (system: SpeakerSystem, user: User) {
      systemChannel.addRoles(system.pk, user.pk, 'speaker') // TODO enumerate speaker system roles
    }

    function getSystemMenu (s: SpeakerSystem): MenuItem[] {
      if (speakerSystemType.rules.canDelete(s)) {
        return [{
          title: t('delete'),
          icon: 'mdi-pencil',
          onClick: async () => { deleteSystem(s) },
          color: ThemeColor.Warning
        }]
      }
      return []
    }

    return {
      t,
      systems,
      SpeakerSystemMethod,
      systemData,
      systemDataReady,
      title: computed(() => t('speakerSystems')),
      createSystem,
      deleteSystem,
      getSystemMenu,
      getUserIds,
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

dl
  display: flex
  flex-flow: row wrap
dt
  flex: 0 0 20%
  font-weight: bold
  text-align: right
  &::after
    content: ':'
dd
  flex: 1 0 80%
  margin: 0
  padding-left: .5em
</style>
