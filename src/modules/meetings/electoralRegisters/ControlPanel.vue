<template>
  <div>
    <h2>{{ t('electoralRegister.settings') }}</h2>
    <v-alert v-if="erInfo" class="my-4" v-bind="erInfo" />
    <form v-if="editing" @submit.prevent="save()">
      <SelectVue name="er_select" :label="t('electoralRegister.method')" required v-model="settings.er_policy_name" :options="erOptions" />
      <div class="text-right">
        <v-btn type="submit" :disabled="disabled" color="primary">
          {{ t('save') }}
        </v-btn>
      </div>
    </form>
    <div v-else-if="erOptions" class="pa-12 text-center">
      <v-btn color="primary" size="large" prepend-icon="mdi-book-account" @click="editing = true">
        Ändra metod för röstlängder
      </v-btn>
    </div>
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
import useAlert from '@/composables/useAlert'

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
    const { erMethods } = useElectoralRegisters()
    const settings = reactive<Pick<Meeting, 'er_policy_name'>>({ er_policy_name: meeting.value?.er_policy_name })
    const { alert } = useAlert()

    const editing = ref(!!meeting.value && !meeting.value.er_policy_name)
    const submitting = ref(false)

    const erOptions = computed(() => {
      return Object.fromEntries(erMethods.map(({ name }) => [name, t(`erMethods.${name}.title`)]))
    })

    const erInfo = computed(() => {
      const name = meeting.value?.er_policy_name
      if (!name) return
      return {
        title: t('electoralRegister.activeMethod', { method: t(`erMethods.${name}.title`) }),
        text: t(`erMethods.${name}.description`),
        type: name === 'auto_always'
          ? 'warning'
          : 'info'
      }
    })

    async function save () {
      submitting.value = true
      try {
        await meetingType.api.patch(meetingId.value, settings)
      } catch {
        alert('*Could not save method for electoral register.')
      }
      submitting.value = false
    }

    const disabled = computed(() => {
      return submitting.value || !settings.er_policy_name
    })

    watch(meeting, m => {
      if (!m) return
      settings.er_policy_name = m.er_policy_name
      editing.value = !m.er_policy_name
    })

    return {
      t,
      erInfo,
      editing,
      disabled,
      erOptions,
      settings,
      submitting,
      save
    }
  }
})
</script>
