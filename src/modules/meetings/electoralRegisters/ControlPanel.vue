<template>
  <div>
    <h2>{{ t('electoralRegister.settings') }}</h2>
    <v-card
      v-for="{ description, name, props, title } in methods"
      :key="name"
      :title="title"
      :text="description"
      class="my-4"
      v-bind="props"
      @click="currentName = name"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'

import { openDialogEvent } from '@/utils/events'
import useAlert from '@/composables/useAlert'
import { meetingType } from '../contentTypes'
import useMeeting from '../useMeeting'

import useElectoralRegisters from './useElectoralRegisters'
import { dialogQuery } from '@/utils'

const { t } = useI18n()
const { meeting, meetingId } = useMeeting()
const { erMethods } = useElectoralRegisters(meetingId)
const { alert } = useAlert()
const api = meetingType.getContentApi({ alertOnError: false })

const currentName = computed({
  get () {
    return meeting.value?.er_policy_name
  },
  async set (name) {
    if (!name || isCurrent(name)) return
    if (!await dialogQuery(t('electoralRegister.confirmMethodChange', { name: t(`erMethods.${name}.title`) }))) return
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

function isCurrent (name: string) {
  return name === currentName.value
}

function getColor (name: string) {
  if (!isCurrent(name)) return
  return name === 'auto_always' ? 'warning' : 'info'
}

const methods = computed(() => {
  return erMethods.map(({ name }) => ({
    description: t(`erMethods.${name}.description`),
    name,
    props: {
      elevation: isCurrent(name) ? 6 : 0,
      color: getColor(name),
      class: {
        'pa-4': isCurrent(name)
      }
    },
    title: t(`erMethods.${name}.title`)
  }))
})
</script>
