<template>
  <main>
    <form @submit.prevent="addMeeting()">
      <v-text-field :label="t('title')" autocomplete="off" v-model="formData.title" :hint="t('meeting.createTitleHint')" />
      <SelectVue name="er_select" :label="t('electoralRegister.method')" required v-model="formData.er_policy_name" :options="erOptions" />
      <div>
        <v-switch color="primary" v-model="formData.public" :label="t('meeting.public')" />
      </div>
      <div class="text-right">
        <v-btn variant="text" @click="$emit('close')">
          {{ t('cancel') }}
        </v-btn>
        <v-btn type="submit" color="primary" prepend-icon="mdi-send" :disabled="disabled">
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
import { meetingType } from './contentTypes'
import useElectoralRegisters from './useElectoralRegisters'

export default defineComponent({
  components: {
    SelectVue
  },
  emits: ['close'],
  setup () {
    const { t } = useI18n()
    const router = useRouter()
    const { erMethods } = useElectoralRegisters()

    const formData = reactive({
      title: '',
      public: false,
      er_policy_name: undefined
    })
    const submitting = ref(false)

    const disabled = computed(() => submitting.value || formData.title.length <= 5 || !formData.er_policy_name)

    const erOptions = computed(() => {
      return Object.fromEntries(erMethods.map(({ name }) => [name, t(`erMethods.${name}.title`)]))
    })

    async function addMeeting () {
      if (submitting.value) return
      submitting.value = true
      try {
        const { data } = await meetingType.api.add(formData)
        router.push(`/m/${data.pk}/${slugify(data.title)}`)
      } catch {
        // TODO
      }
      submitting.value = false
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
