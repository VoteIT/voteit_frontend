<template>
  <div>
    <h2>{{ t('electoralRegister.settings') }}</h2>
    <template v-for="{ description, isCurrent, name, props, title } in methods" :key="name">
      <v-card
        v-if="isCurrent"
        :title="title"
        :text="description"
        class="my-4"
        v-bind="props"
      />
      <QueryDialog v-else :text="t('electoralRegister.confirmMethodChange', { name: t(`erMethods.${name}.title`) })" @confirmed="currentName = name">
        <template #activator="activator">
          <v-card
            :title="title"
            :text="description"
            class="my-4"
            v-bind="{ ...props, ...activator.props }"
          />
        </template>
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
const { availableErMethods } = useElectoralRegisters(meetingId)
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
      description: method.description || t(`erMethods.${method.name}.description`),
      isCurrent,
      props: {
        elevation: isCurrent ? 6 : 0,
        color: isCurrent ? 'info' : undefined,
        class: {
          'pa-4': isCurrent
        }
      },
      title: method.title || t(`erMethods.${method.name}.title`)
    }
  })
})
</script>
