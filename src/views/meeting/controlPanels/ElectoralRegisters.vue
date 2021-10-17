<template>
  <div>
    <h2>{{ title }}</h2>
    <form>
      <label for="er_select">
        {{ t('electoralRegister.method') }}
      </label>
      <select id="er_select" v-model="settings.er_policy_name">
        <option disabled :value="undefined">
          {{ t('select') }}
        </option>
        <option v-for="m in methods" :key="m.value" :value="m.value">
          {{ m.name }}
        </option>
      </select>
      <v-alert v-if="status === 'incomplete'" type="warning" class="mt-2">
        {{ t('electoralRegister.selectMethod') }}
      </v-alert>
      <v-alert v-else-if="status === 'saved'" type="success" closable class="mt-2">
        {{ t('electoralRegister.saved', settings) }}
      </v-alert>
      <div class="mt-2">
        <v-btn :disabled="disabled" @click="save()" color="primary">
          {{ t('save') }}
        </v-btn>
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import { computed, ref, reactive, defineComponent, onBeforeMount, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { restApi } from '@/utils'
import meetingType from '@/contentTypes/meeting'
import useMeeting from '@/modules/meetings/useMeeting'
import { Meeting } from '@/contentTypes/types'

interface ERMethod {
  name: string
  value: string
}

const methods = ref<ERMethod[] | null>(null)

export default defineComponent({
  translationKey: 'electoralRegister.plural',
  path: 'ers',
  icon: 'mdi-vote',
  setup () {
    const { t } = useI18n()
    const { meeting, meetingId } = useMeeting()
    const api = meetingType.getContentApi()
    const settings = reactive<Partial<Meeting>>({ er_policy_name: meeting.value?.er_policy_name })
    const status = ref<null | 'incomplete' | 'waiting' | 'saved'>(meeting.value?.er_policy_name ? null : 'incomplete')

    onBeforeMount(async () => {
      if (methods.value) return
      try {
        const { data } = await restApi.get('electoral-registers/methods/')
        methods.value = data
      } catch {}
    })

    async function save () {
      status.value = 'waiting'
      try {
        await api.patch(meetingId.value, settings)
        status.value = 'saved'
      } catch {
        status.value = null
      }
    }

    const disabled = computed(() => {
      return status.value === 'waiting' || !settings.er_policy_name
    })

    watch(() => settings.er_policy_name, value => {
      status.value = value ? null : 'incomplete'
    })

    return {
      t,
      disabled,
      methods,
      save,
      settings,
      status,
      title: computed(() => t('electoralRegister.settings'))
    }
  }
})
</script>
