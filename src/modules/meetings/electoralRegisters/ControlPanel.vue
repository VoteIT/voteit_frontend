<template>
  <div>
    <h2>{{ title }}</h2>
    <form>
      <SelectVue name="er_select" :label="t('electoralRegister.method')" required v-model="settings.er_policy_name" :options="options" />
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
import useMeeting from '@/modules/meetings/useMeeting'
import SelectVue from '@/components/inputs/Select.vue'
import { meetingType } from '../contentTypes'
import { Meeting } from '../types'

interface ERMethod {
  name: string
  value: string
}

const methods = ref<ERMethod[] | null>(null)

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

    const options = computed(() => {
      if (!methods.value) return {}
      const opts: Record<string, string> = {}
      for (const { name, value } of methods.value) {
        opts[name] = value
      }
      return opts
    })

    return {
      t,
      disabled,
      options,
      settings,
      status,
      title: computed(() => t('electoralRegister.settings')),
      save
    }
  }
})
</script>
