<template>
  <div>
    <h2 class="mb-2">
      {{ t('accessPolicy.settings') }}
    </h2>
    <v-row>
      <v-col>
        <v-alert type="info" title="Bjud in deltagare">
          <p class="mb-2">
            {{ t('accessPolicy.invitationsAlert') }}
          </p>
          <v-btn
            color="primary"
            :to="`${meetingPath}/p`"
            prepend-icon="mdi-account">
            {{ t('meeting.participants') }}
          </v-btn>
        </v-alert>
        <v-switch :label="t('meeting.visibleInLists')" v-model="meetingListed" color="primary" :messages="t('accessPolicy.listedMeetingHelp')" />
        <v-expand-transition>
          <div v-if="meetingListed && !hasActivePolicy">
            <v-alert
              type="warning"
              :title="t('accessPolicy.noAccessPolicies')"
              :text="t('accessPolicy.noAccessPoliciesAlert')"
              class="my-4" />
          </div>
        </v-expand-transition>
        <!-- TODO Add more access policies later! -->
        <div class="my-12 text-center">
          <v-btn
            v-if="!accessPolicies.length"
            @click="addAutomaticAccess()"
            prepend-icon="mdi-account-cog"
            size="large"
            color="primary">
            {{ t('accessPolicies.automatic.add') }}
          </v-btn>
        </div>
        <v-card v-for="p in accessPolicies" :key="p.pk">
          <div class="d-flex align-start pr-3">
            <v-card-title class="flex-grow-1">
              {{ t(`accessPolicies.${p.name}.title`) }}
            </v-card-title>
            <v-switch color="primary" :modelValue="p.active" @update:modelValue="setActive(p, $event)" :label="t('active')" class="flex-grow-0" hide-details />
          </div>
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
            <v-tooltip v-if="p.active" :model-value="copied" :text="t('copied')" location="top" :open-on-hover="false">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  prepend-icon="mdi-content-copy"
                  :color="copied ? 'success' : 'primary'"
                  variant="elevated"
                  @click="copy(meetingUrl)"
                >
                  {{ t('meeting.copyUrl') }}
                </v-btn>
              </template>
            </v-tooltip>
            <QueryDialog :text="t('accessPolicy.confirmDelete')" color="warning" @confirmed="deletePolicy(p)">
              <template #activator="{ props }">
                <v-btn color="warning" prepend-icon="mdi-delete" v-bind="props">
                  {{ t('delete') }}
                </v-btn>
              </template>
            </QueryDialog>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useClipboard } from '@vueuse/core'

import useAlert from '@/composables/useAlert'
import { AccessPolicyType } from '@/contentTypes/types'
import useMeeting from '@/modules/meetings/useMeeting'

import useAccessPolicies from './useAccessPolicies'
import { MeetingRole } from '../types'
import { meetingType } from '../contentTypes'
import QueryDialog from '@/components/QueryDialog.vue'

const NON_MODIFIABLE_ROLES = [
  'participant',
  'moderator'
]

const { t } = useI18n()
const { meetingId, meeting, meetingPath, meetingUrl } = useMeeting()
const { alert } = useAlert()
const { accessPolicies, hasActivePolicy, addPolicy, deletePolicy, setActive, setRoles } = useAccessPolicies(meetingId)

async function addAutomaticAccess () {
  await addPolicy({
    meeting: meetingId.value,
    name: AccessPolicyType.Automatic,
    roles_given: [MeetingRole.Participant]
  })
}

const meetingListed = computed<boolean>({
  get () {
    return !!meeting.value && meeting.value.visible_in_lists
  },
  set (value) {
    try {
      meetingType.api.patch(meetingId.value, {
        visible_in_lists: value
      })
    } catch {
      alert('*Could not set meeting visible_in_lists status')
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

const { copy, copied } = useClipboard()
</script>
