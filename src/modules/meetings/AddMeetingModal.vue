<template>
  <main>
    <form @submit.prevent="addMeeting()">
      <v-text-field :label="t('title')" autocomplete="off" v-model="formData.title" hint="At least 5 characters" />
      <div>
        <Switch type="checkbox" id="meeting_public" v-model="formData.public" :label="t('meeting.public')" />
      </div>
      <Btn icon="mdi-send" :disabled="disabled" @click="addMeeting()">{{ t('create') }}</Btn>
    </form>
  </main>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { slugify } from '@/utils'

import meetingType from '@/contentTypes/meeting'
import useModal from '@/composables/useModal'

export default defineComponent({
  name: 'AddMeetingModal',
  setup () {
    const { t } = useI18n()
    const router = useRouter()
    const meetingApi = meetingType.getContentApi()
    const modal = useModal()

    const formData = reactive({
      title: '',
      public: false
    })
    const submitting = ref(false)

    const disabled = computed(() => submitting.value || formData.title.length <= 5)

    async function addMeeting () {
      if (submitting.value) return
      submitting.value = true
      const { data } = await meetingApi.add(formData)
      modal.closeModal()
      router.push(`/m/${data.pk}/${slugify(data.title)}`)
    }

    return {
      t,
      formData,
      disabled,
      addMeeting
    }
  }
})
</script>
