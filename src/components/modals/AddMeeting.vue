<template>
  <main>
    <form @submit.prevent="addMeeting()">
      <label for="meeting_title">{{ t('title') }}:</label><br/>
      <input id="meeting_title" type="text" v-model="formData.title" placeholder="Meeting title (at least 5 characters)" /><br/>
      <input type="checkbox" id="meeting_public" v-model="formData.public" /> <label for="meeting_public">{{ t('meeting.public') }}</label><br/>
      <Btn icon="mdi-send" :disabled="disabled" @click="addMeeting()">{{ t('create') }}</Btn>
    </form>
  </main>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { slugify } from '@/utils'

import meetingType from '@/contentTypes/meeting'
import useModal from '@/composables/useModal'

export default defineComponent({
  name: 'AddMeetingModal',
  inject: ['t'],
  setup () {
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
      formData,
      disabled,
      addMeeting
    }
  }
})
</script>
