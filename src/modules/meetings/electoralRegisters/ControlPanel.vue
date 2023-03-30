<template>
  <div>
    <h2>{{ t('electoralRegister.settings') }}</h2>
    <v-alert
      v-if="erMethodLocked"
      icon="mdi-cancel"
      :text="t('electoralRegister.dialectChangeMethodDisallowed')"
      color="secondary"
      class="my-4"
    />
    <template v-for="method in methods" :key="method.name">
      <v-card
        v-if="method.isCurrent"
        :title="method.title"
        class="my-4"
        v-bind="method.props">
      <v-card-text>
        <p>
          <span v-if="method.handles_active_check">Active check</span>
          <span v-if="method.handles_vote_weight">Weighted votes</span>
          <span v-if="method.group_votes_active">Votes from groups</span>
        </p>
        {{ method.description }}
      </v-card-text>
        </v-card>
      <QueryDialog v-else @confirmed="currentName = method.name">
        <template #activator="activator">
          <v-card
            :title="method.title"
            class="my-4"
            v-bind="{ ...method.props, ...activator.props }"
          >
          <v-card-text>
            <p>
              <span v-if="method.handles_active_check">Active check</span>
              <span v-if="method.handles_vote_weight">Weighted votes</span>
              <span v-if="method.group_votes_active">Votes from groups</span>
            </p>
            {{ method.description }}
          </v-card-text>
        </v-card>
        </template>
        <i18n-t keypath="electoralRegister.confirmMethodChange">
          <template #name>
            <strong>
              {{ method.title }}
            </strong>
          </template>
        </i18n-t>
      </QueryDialog>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'

import { openDialogEvent } from '@/utils/events'
import QueryDialog from '@/components/QueryDialog.vue'
import useAlert from '@/composables/useAlert'
import { meetingType } from '../contentTypes'
import useMeeting from '../useMeeting'

import useElectoralRegisters from './useElectoralRegisters'

const { t } = useI18n()
const { meeting, meetingId } = useMeeting()
const { availableErMethods, erMethodLocked } = useElectoralRegisters(meetingId)
const { alert } = useAlert()
const api = meetingType.getContentApi({ alertOnError: false })

const currentName = computed({
  get () {
    return meeting.value?.er_policy_name
  },
  async set (name) {
    if (name === meeting.value?.er_policy_name) return
    try {
      await api.patch(meetingId.value, { er_policy_name: name })
    } catch (e) {
      if (axios.isAxiosError(e)) {
        if (!e.response) return alert('^Could not reach server')
        return openDialogEvent.emit({
          title: e.response.data.er_policy_name.join('\n'),
          no: false,
          yes: t('ok'),
          resolve () {}
        })
      }
      alert('^Unknown error')
    }
  }
})

const methods = computed(() => {
  return availableErMethods.value?.map(method => {
    const isCurrent = method.name === currentName.value
    return {
      ...method,
      description: method.description,
      isCurrent,
      props: {
        elevation: isCurrent ? 6 : 0,
        color: isCurrent ? 'info' : undefined,
        class: {
          'pa-4': isCurrent
        }
      },
      handles_active_check: method.handles_active_check,
      handles_vote_weight: method.handles_vote_weight,
      group_votes_active: method.group_votes_active,
      title: method.title
    }
  })
})
</script>
