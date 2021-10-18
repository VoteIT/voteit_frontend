<template>
  <div>
    <h2>{{ t('speaker.settings') }}</h2>
    <v-alert type="info" :text="t('speaker.settingsHelp')" class="my-4" />
    <v-dialog v-model="createDialogOpen">
      <template #activator="{ props }">
        <v-btn color="primary" v-bind="props" prepend-icon="mdi-plus">{{ t('speaker.systemAdd') }}</v-btn>
      </template>
      <v-card tag="form" :title="t('speaker.systemAdd')" width="1280" max-width="100%" color="background" @submit.prevent="createSystem()">
        <v-card-text>
          <v-text-field :label="t('title')" v-model="systemData.title" />
          <SelectVue required :label="t('speaker.systemMethod')" v-model="systemData.method_name" :options="SpeakerSystemMethod" />
          <p>
            <label for="speakersystem-safepos">{{ t('speaker.safePositions') }}</label>
            <input id="speakersystem-safepos" type="number" min="0" max="2" v-model="systemData.safe_positions" style="width: 100%">
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn type="submit" color="primary" prepend-icon="mdi-plus" :disabled="!createReady">{{ t('add') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <Widget class="speaker-system my-4" v-for="system in systems" :key="system.pk">
      <Menu float :items="getSystemMenu(system)" show-transitions :content-type="speakerSystemType" :object="system"/>
      <h2>{{ system.title }}</h2>
      <v-list density="comfortable">
        <v-list-item v-for="{ key, value } in getSystemData(system)" :key="key" :title="key" :subtitle="value" />
      </v-list>
      <UserSearch class="mt-4" @submit="addUser(system, $event)" :omitIds="getUserIds(system.pk)" />
      <RoleMatrix class="mt-2" admin :channel="systemChannel" :pk="system.pk" :icons="systemIcons" />
    </Widget>
    <v-dialog v-model="editDialogOpen">
      <v-card tag="form" :title="t('speaker.systemEdit')" width="1280" max-width="100%" color="background" @submit.prevent="saveSystem()">
        <v-card-text>
          <v-text-field :label="t('title')" v-model="editSystemData.title" />
          <SelectVue required :label="t('speaker.systemMethod')" v-model="editSystemData.method_name" :options="SpeakerSystemMethod" />
          <p>
            <label for="speakersystem-safepos">{{ t('speaker.safePositions') }}</label>
            <input id="speakersystem-safepos" type="number" min="0" max="2" v-model="editSystemData.safe_positions" style="width: 100%">
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn type="submit" color="primary" prepend-icon="mdi-check">{{ t('save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'

import useLoader from '@/composables/useLoader'
import useMeeting from '@/modules/meetings/useMeeting'
import useSpeakerLists from '@/modules/speakerLists/useSpeakerLists'

import RoleMatrix from '@/components/RoleMatrix.vue'
import SelectVue from '@/components/inputs/Select.vue'
import UserSearch from '@/components/UserSearch.vue'

import { ContextRole } from '@/composables/types'
import { MenuItem, ThemeColor } from '@/utils/types'

import { canChangeSpeakerSystem, canDeleteSpeakerSystem } from './rules'
import { SpeakerSystem, SpeakerSystemMethod, SpeakerSystemRole } from './types'
import { speakerSystemType } from './contentTypes'
import { User } from '../organisations/types'

const systemIcons = {
  speaker: 'mdi-chat',
  list_moderator: 'mdi-gavel'
}

export default defineComponent({
  components: {
    UserSearch,
    RoleMatrix,
    SelectVue
  },
  translationKey: 'speaker.systems',
  path: 'speakers',
  icon: 'mdi-account-voice',
  setup () {
    const { t } = useI18n()
    const { meetingId, meeting } = useMeeting()
    const speakerLists = useSpeakerLists()
    const loader = useLoader('SpeakerSystems panel')
    const systemRoles = ref<ContextRole[]>([])
    const { getUserIds } = speakerSystemType.useContextRoles()

    onBeforeMount(() => {
      loader.call(async () => {
        systemRoles.value = await speakerSystemType.channel.getAvailableRoles()
      })
    })

    const systems = computed(() => speakerLists.getSystems(meetingId.value, true))
    const systemData = reactive<Partial<SpeakerSystem>>({
      title: t('speaker.system'),
      safe_positions: 1
    })
    const createDialogOpen = ref(false)
    const creating = ref(false)
    const createReady = computed(() => !creating.value && systemData.title && systemData.method_name)

    async function createSystem () {
      creating.value = true
      try {
        await speakerSystemType.api.add({ ...systemData, meeting: meetingId.value })
        systemData.title = t('speaker.system')
        systemData.safe_positions = 1
        delete systemData.method_name
        createDialogOpen.value = false
      } catch (e) {
        console.error(e)
      }
      creating.value = false
    }

    const editDialogOpen = ref(false)
    const editSystemPk = ref<number | null>(null)
    const editSystemData = reactive<Partial<SpeakerSystem>>({})
    function editSystem (system: SpeakerSystem) {
      editSystemData.title = system.title
      editSystemData.method_name = system.method_name
      editSystemData.safe_positions = system.safe_positions
      editSystemPk.value = system.pk
      editDialogOpen.value = true
    }
    async function saveSystem () {
      if (!editSystemPk.value) return
      try {
        await speakerSystemType.api.patch(editSystemPk.value, { ...editSystemData })
        editDialogOpen.value = false
      } catch (e) {
        console.error(e)
      }
    }

    async function deleteSystem (system: SpeakerSystem) {
      if (await dialogQuery({
        title: t('speaker.confirmSystemDeletion'),
        theme: ThemeColor.Warning
      })) speakerSystemType.api.delete(system.pk)
    }

    function addUser (system: SpeakerSystem, user: User) {
      speakerSystemType.channel.addRoles(system.pk, user.pk, SpeakerSystemRole.Speaker)
    }

    function getSystemMenu (s: SpeakerSystem): MenuItem[] {
      const items = []
      if (canChangeSpeakerSystem(s)) {
        items.push({
          title: t('edit'),
          icon: 'mdi-pencil',
          onClick: async () => editSystem(s)
        })
      }
      if (canDeleteSpeakerSystem(s)) {
        items.push({
          title: t('delete'),
          icon: 'mdi-delete',
          onClick: async () => deleteSystem(s),
          color: ThemeColor.Warning
        })
      }
      return items
    }

    function getSystemData (system: SpeakerSystem): {key: string, value: string | number }[] {
      return [
        {
          key: t('state'),
          value: system.state
        },
        {
          key: t('speaker.systemMethod'),
          value: system.method_name
        },
        {
          key: t('speaker.safePositions'),
          value: String(system.safe_positions) ?? t('speaker.noSafePositions')
        }
      ]
    }

    return {
      t,
      createDialogOpen,
      createReady,
      editDialogOpen,
      editSystemData,
      meeting,
      systems,
      SpeakerSystemMethod,
      systemData,
      systemChannel: speakerSystemType.channel,
      systemRoles,
      speakerSystemType,
      systemIcons,
      title: computed(() => t('speakerSystems')),
      addUser,
      createSystem,
      deleteSystem,
      getSystemMenu,
      getSystemData,
      getUserIds,
      saveSystem
    }
  }
})
</script>

<style lang="sass" scoped>
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
