<template>
  <div>
    <h2>{{ t('electoralRegister.settings') }}</h2>
    <form @submit.prevent="save()">
      <SelectVue name="er_select" :label="t('electoralRegister.method')" required v-model="settings.er_policy_name" :options="erOptions" />
      <div>
        <v-btn type="submit" :disabled="disabled" color="primary">
          {{ t('save') }}
        </v-btn>
      </div>
      <v-alert v-if="status === 'incomplete'" type="warning" class="mt-2">
        {{ t('electoralRegister.selectMethod') }}
      </v-alert>
      <v-alert v-else-if="status === 'saved'" type="success" closable class="mt-2">
        {{ t('electoralRegister.saved', settings) }}
      </v-alert>
    </form>
  </div>
</template>

<script lang="ts">
import { computed, ref, reactive, defineComponent, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useMeeting from '@/modules/meetings/useMeeting'
import SelectVue from '@/components/inputs/Select.vue'
import { meetingType } from '../contentTypes'
import { Meeting } from '../types'
import useElectoralRegisters from '../useElectoralRegisters'

export default defineComponent({
  translationKey: 'electoralRegister.plural',
  path: 'ers',
  icon: 'mdi-vote',
  components: {
    SelectVue
  },
  setup () {
    const { t } = useI18n()
    const { meeting, meetingId } = useMeeting()
    const { erOptions } = useElectoralRegisters()
    const settings = reactive<Partial<Meeting>>({ er_policy_name: meeting.value?.er_policy_name })
    const status = ref<null | 'incomplete' | 'waiting' | 'saved'>(meeting.value?.er_policy_name ? null : 'incomplete')

    async function save () {
      status.value = 'waiting'
      try {
        await meetingType.api.patch(meetingId.value, settings)
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
      erOptions,
      settings,
      status,
      save
    }
  }
})
</script>
