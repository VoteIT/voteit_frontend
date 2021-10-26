<template>
  <main>
    <form @submit.prevent="addMeeting()">
      <v-text-field :label="t('title')" autocomplete="off" v-model="formData.title" :hint="t('meeting.createTitleHint')" />
      <SelectVue name="er_select" :label="t('electoralRegister.method')" required v-model="formData.er_policy_name" :options="erOptions" class="mb-6" />
      <div>
        <Switch type="checkbox" id="meeting_public" v-model="formData.public" :label="t('meeting.public')" />
      </div>
      <div class="text-right">
        <v-btn color="primary" prepend-icon="mdi-send" :disabled="disabled">
          {{ t('create') }}
        </v-btn>
      </div>
    </form>
  </main>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { slugify } from '@/utils'

import SelectVue from '@/components/inputs/Select.vue'
import useModal from '@/composables/useModal'
import { meetingType } from './contentTypes'
import useElectoralRegisters from './useElectoralRegisters'

export default defineComponent({
  components: {
    SelectVue
  },
  setup () {
    const { t } = useI18n()
    const router = useRouter()
    const modal = useModal()
    const { erOptions } = useElectoralRegisters()

    const formData = reactive({
      title: '',
      public: false,
      er_policy_name: undefined
    })
    const submitting = ref(false)

    const disabled = computed(() => submitting.value || formData.title.length <= 5 || !formData.er_policy_name)

    async function addMeeting () {
      if (submitting.value) return
      submitting.value = true
      const { data } = await meetingType.api.add(formData)
      modal.closeModal()
      router.push(`/m/${data.pk}/${slugify(data.title)}`)
    }

    return {
      t,
      erOptions,
      formData,
      disabled,
      addMeeting
    }
  }
})
</script>
