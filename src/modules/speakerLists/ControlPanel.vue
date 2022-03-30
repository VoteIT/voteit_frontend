<template>
  <div>
    <v-alert type="info" :text="t('speaker.settingsHelp')" class="my-4" />
    <div class="d-flex">
      <h2 class="text-truncate">
        {{ t('speaker.settings') }}
      </h2>
      <v-spacer />
      <v-dialog v-model="createDialogOpen">
        <template #activator="{ props }">
          <v-btn color="primary" v-bind="props" prepend-icon="mdi-plus">{{ t('speaker.systemAdd') }}</v-btn>
        </template>
        <v-card tag="form" :title="t('speaker.systemAdd')" width="1280" max-width="100%" color="background" @submit.prevent="createSystem()">
          <v-card-text>
            <v-text-field :label="t('title')" v-model="systemData.title" />
            <SelectVue required :label="t('speaker.systemMethod')" v-model="systemData.method_name" :options="orderMethods" />
  <!-- TODO Better dynamic forms -->
            <v-expand-transition>
              <div v-if="createSystemSettings">
                <v-text-field v-for="field in createSystemSettings" :key="field.name" v-bind="field" />
              </div>
            </v-expand-transition>
            <v-text-field type="number" :label="t('speaker.safePositions')" min="0" max="2" v-model="systemData.safe_positions" class="mt-8" />
            <CheckboxMultipleSelect v-model="systemData.meeting_roles_to_speaker" :settings="{ options: roleLabels }" :label="t('speaker.speakerRoles')" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="createDialogOpen = false">
              {{ t('cancel') }}
            </v-btn>
            <v-btn type="submit" color="primary" prepend-icon="mdi-plus" :disabled="!createReady">
              {{ t('add') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
    <!-- <v-table class="my-4" id="speaker-systems-table">
      <thead>
        <tr>
          <th width="33%">
            {{ t('title' )}}
          </th>
          <th>
            {{ t('speaker.systemMethod') }}
          </th>
          <th>
            {{ t('speaker.safePositions') }}
          </th>
          <th colspan="2">
            {{ t('speaker.speakerRoles') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="{ system, menu } in systems" :key="system.pk">
          <td>
            {{ system.title }}
          </td>
          <td>
            {{ t(`speaker.orderMethod.${system.method_name}`) }}
          </td>
          <td>
            {{ system.safe_positions ?? t('speaker.noSafePositions') }}
          </td>
          <td>
            {{ system.meeting_roles_to_speaker.map(r => t(`role.${r}`)).join(', ') }}
          </td>
          <td class="text-right">
            <Menu :items="menu" show-transitions :content-type="speakerSystemType" :object="system"/>
          </td>
        </tr>
      </tbody>
    </v-table> -->
    <Widget class="speaker-system my-4" v-for="{ system, menu, data, userSearch } in systems" :key="system.pk">
      <div class="d-flex">
        <h2 class="flex-grow-1">
          {{ system.title }}
        </h2>
        <Menu float :items="menu" show-transitions :content-type="speakerSystemType" :object="system"/>
      </div>
      <v-list density="comfortable">
        <v-list-item v-for="{ key, value } in data" :key="key" :title="key" :subtitle="value" />
      </v-list>
      <UserSearch class="mt-4" v-bind="userSearch" />
      <RoleMatrix class="mt-2" admin :contentType="speakerSystemType" :pk="system.pk" :icons="systemIcons" />
    </Widget>
    <v-dialog v-model="editDialogOpen">
      <v-card tag="form" :title="t('speaker.systemEdit')" width="1280" max-width="100%" color="background" @submit.prevent="saveSystem()">
        <v-card-text>
          <v-text-field :label="t('title')" v-model="editSystemData.title" />
          <SelectVue required :label="t('speaker.systemMethod')" v-model="editSystemData.method_name" :options="orderMethods" />
<!-- TODO Better dynamic forms -->
          <v-expand-transition>
            <div v-if="editSystemSettings">
              <v-text-field v-for="field in editSystemSettings" :key="field.name" v-bind="field" />
            </div>
          </v-expand-transition>
          <v-text-field type="number" :label="t('speaker.safePositions')" min="0" max="2" v-model="editSystemData.safe_positions" />
          <CheckboxMultipleSelect v-model="editSystemData.meeting_roles_to_speaker" :settings="{ options: roleLabels }" :label="t('speaker.speakerRoles')" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editDialogOpen = false">
            {{ t('cancel') }}
          </v-btn>
          <v-btn type="submit" color="primary" prepend-icon="mdi-check" :disabled="!editSystemReady">
            {{ t('save') }}
          </v-btn>
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
import CheckboxMultipleSelect from '@/components/inputs/CheckboxMultipleSelect.vue'
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
    CheckboxMultipleSelect,
    RoleMatrix,
    SelectVue,
    UserSearch
  },
  translationKey: 'speaker.systems',
  path: 'speakers',
  icon: 'mdi-account-voice',
  setup () {
    const { t } = useI18n()
    const { meetingId, meeting, roleLabels } = useMeeting()
    const speakerLists = useSpeakerLists()
    const loader = useLoader('SpeakerSystems panel')
    const systemRoles = ref<ContextRole[]>([])
    const { getUserIds } = speakerSystemType.useContextRoles()

    onBeforeMount(() => {
      loader.call(async () => {
        systemRoles.value = await speakerSystemType.getAvailableRoles()
      })
    })

    const systemData = reactive<Partial<SpeakerSystem>>({
      title: t('speaker.system'),
      safe_positions: 1,
      meeting_roles_to_speaker: []
    })
    const createSystemSettings = computed<Record<string, any>[] | undefined>(() => getMethodSettings(systemData))
    const createDialogOpen = ref(false)
    const creating = ref(false)
    const createReady = computed(() => !creating.value && systemData.title && systemData.method_name && systemData.meeting_roles_to_speaker?.length)

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

    function getMethodSettings (data: Partial<SpeakerSystem>) {
      if (data.method_name === SpeakerSystemMethod.Priority) { // TODO BETTER
        if (!data.settings) data.settings = { max_times: 0 }
        return [{
          type: 'number',
          min: 0,
          modelValue: data.settings.max_times,
          // eslint-disable-next-line camelcase
          'onUpdate:modelValue': (max_times: number) => { data.settings = { max_times } },
          label: t('speaker.orderMethod.maxTimes'),
          hint: t('speaker.orderMethod.maxTimesHint')
        }]
      }
      // If no settings, ensure there's no setting data
      delete data.settings
    }

    const editDialogOpen = ref(false)
    const editSystemPk = ref<number | null>(null)
    const editSystemData = reactive<Partial<SpeakerSystem>>({})
    const editSystemReady = computed(() => editSystemData.title && editSystemData.meeting_roles_to_speaker?.length)
    const editSystemSettings = computed<Record<string, any>[] | undefined>(() => getMethodSettings(editSystemData))
    function editSystem (system: SpeakerSystem) {
      Object.assign(editSystemData, system)
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
          value: t(`workflowState.${system.state}`)
        },
        {
          key: t('speaker.systemMethod'),
          value: t(`speaker.orderMethod.${system.method_name}`)
        },
        {
          key: t('speaker.safePositions'),
          value: String(system.safe_positions) ?? t('speaker.noSafePositions')
        },
        {
          key: t('speaker.speakerRoles'),
          value: system.meeting_roles_to_speaker.map(r => t(`role.${r}`)).join(', ')
        }
      ]
    }

    const systems = computed(() => {
      return speakerLists.getSystems(meetingId.value, true)
        .map(system => {
          const userIds = getUserIds(system.pk)
          return {
            system,
            menu: getSystemMenu(system),
            data: getSystemData(system),
            userSearch: {
              params: { meeting: meetingId.value },
              filter: (user: User) => !userIds.includes(user.pk),
              onSubmit: (user: User) => speakerSystemType.addRoles(system.pk, user.pk, SpeakerSystemRole.Speaker)
            }
          }
        })
    })

    const orderMethods = computed(() => {
      return Object.fromEntries(
        Object.values(SpeakerSystemMethod)
          .map(name => [name, t(`speaker.orderMethod.${name}`)])
      )
    })

    return {
      t,
      createDialogOpen,
      createReady,
      createSystemSettings,
      editDialogOpen,
      editSystemData,
      editSystemSettings,
      editSystemReady,
      meeting,
      orderMethods,
      roleLabels,
      systems,
      systemData,
      systemRoles,
      speakerSystemType,
      systemIcons,
      createSystem,
      deleteSystem,
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
