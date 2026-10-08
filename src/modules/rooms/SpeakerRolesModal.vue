<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import RoleMatrix from '@/components/RoleMatrix.vue'
import UserSearch from '@/components/UserSearch.vue'
import useErrorHandler from '@/composables/useErrorHandler'

import useMeetingId from '../meetings/useMeetingId'
import { translateMeetingRole } from '../meetings/utils'
import { IUser } from '../organisations/types'
import { speakerSystemType } from '../speakerLists/contentTypes'
import { SpeakerSystemRole } from '../speakerLists/types'
import useSpeakerStore from '../speakerLists/useSpeakerStore'

const props = defineProps<{
  room: number
}>()

const { t } = useI18n()
const meetingId = useMeetingId()
const { getRoomSpeakerSystem } = useSpeakerStore()
const { getUserIds } = speakerSystemType.useContextRoles()
const { handled } = useErrorHandler({ target: 'dialog' })

const systemIcons: Record<SpeakerSystemRole, string> = {
  speaker: 'mdi-chat',
  list_moderator: 'mdi-gavel'
}

const selectedRole = shallowRef(SpeakerSystemRole.Speaker)
const roleItems = computed(() =>
  Object.values(SpeakerSystemRole).map((value) => ({
    value,
    title: speakerSystemType.getRole(value).translateName(t),
    props: { prependIcon: systemIcons[value] }
  }))
)

const speakerSystem = computed(() => getRoomSpeakerSystem(props.room))
const userIds = computed(() =>
  speakerSystem.value ? getUserIds(speakerSystem.value.pk) : []
)

function addRole(user: number) {
  if (!speakerSystem.value)
    throw new Error("Can't add roles without speaker system")
  const { pk } = speakerSystem.value
  return handled(
    () => speakerSystemType.addRoles(pk, user, selectedRole.value),
    'roles'
  )
}
</script>

<template>
  <template v-if="speakerSystem">
    <p class="mb-3">
      <i18n-t
        keypath="speaker.handleRolesHelp"
        :plural="speakerSystem.meeting_roles_to_speaker.length"
      >
        <template #roles>
          <strong>
            {{
              speakerSystem.meeting_roles_to_speaker
                .map((r) => translateMeetingRole(r, t))
                .join(', ')
            }}
          </strong>
        </template>
      </i18n-t>
    </p>
    <RoleMatrix
      admin
      class="mb-4"
      :content-type="speakerSystemType"
      :icons="systemIcons"
      :pk="speakerSystem.pk"
    />
    <div class="d-flex flex-wrap ga-2 mb-2">
      <v-select
        v-model="selectedRole"
        class="role-select flex-grow-0"
        hide-details
        :items="roleItems"
        :label="$t('role.add')"
        :prepend-inner-icon="systemIcons[selectedRole]"
      />
      <UserSearch
        class="flex-grow-1"
        :filter="({ pk }: IUser) => !userIds.includes(pk)"
        :params="{ meeting: meetingId }"
        @submit="addRole"
      />
    </div>
  </template>
</template>

<style lang="sass" scoped>
.role-select
  min-width: 200px
</style>
