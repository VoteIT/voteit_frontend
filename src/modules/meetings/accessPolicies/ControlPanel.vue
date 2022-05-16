<template>
  <div>
    <h2 class="mb-2">
      {{ t('accessPolicy.settings') }}
    </h2>
    <v-row>
      <v-col>
        <v-switch :label="t('meeting.public')" v-model="meetingPublic" color="primary" />
        <v-card v-for="p in accessPolicies" :key="p.pk">
          <v-card-header class="d-flex align-start">
            <v-card-title class="flex-grow-1">
              {{ t(`accessPolicies.${p.name}.title`) }}
            </v-card-title>
            <v-switch color="primary" :modelValue="p.active" @update:modelValue="setActive(p, $event)" :label="t('active')" class="flex-grow-0" hide-details />
          </v-card-header>
          <v-card-text>
            <p class="mb-4">
              {{ t(`accessPolicies.${p.name}.description`) }}
            </p>
            <h2 class="text-h6 mb-2">
              {{ t('accessPolicy.rolesGiven') }}
            </h2>
            <div>
              <v-chip-group :modelValue="p.roles_given" @update:modelValue="setRoles(p, $event)" multiple>
                <v-chip color="primary" v-for="role in roles" :key="role.value" v-bind="role" />
              </v-chip-group>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="warning" prepend-icon="mdi-delete" @click="_delete(p)">{{ t('delete') }}</v-btn>
            <!-- <v-btn color="primary" prepend-icon="mdi-pencil" @click="alert('*Not implemented (missing API)')">{{ t('edit') }}</v-btn> -->
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import useAlert from '@/composables/useAlert'
import { AccessPolicy } from '@/contentTypes/types'
import useMeeting from '@/modules/meetings/useMeeting'

import useAccessPolicies from './useAccessPolicies'
import { MeetingRole } from '../types'
import { meetingType } from '../contentTypes'

const NON_MODIFIABLE_ROLES = [
  'participant',
  'moderator'
]

export default defineComponent({
  translationKey: 'accessPolicy.plural',
  path: 'aps',
  icon: 'mdi-key',
  setup () {
    const { t } = useI18n()
    const { meetingId, meeting } = useMeeting()
    const { alert } = useAlert()
    const { accessPolicies, deletePolicy, setActive, setRoles } = useAccessPolicies(meetingId)

    async function _delete (p: AccessPolicy) {
      if (!await dialogQuery(t('accessPolicy.confirmDelete'))) return
      await deletePolicy(p)
    }

    const meetingPublic = computed<boolean>({
      get () {
        return !!meeting.value && meeting.value.public
      },
      set (value) {
        try {
          meetingType.api.patch(meetingId.value, {
            public: value
          })
        } catch {
          alert('*Could not set meeting public status')
        }
      }
    })

    const roles = computed(() => {
      return Object.values(MeetingRole)
        .filter(
          r => r
        )
        .map(
          r => ({ text: t(`role.${r}`), value: r, disabled: NON_MODIFIABLE_ROLES.includes(r) })
        )
    })

    return {
      t,
      accessPolicies,
      roles,
      alert,
      _delete,
      meetingPublic,
      setActive,
      setRoles
    }
  }
})
</script>
