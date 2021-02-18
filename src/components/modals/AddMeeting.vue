<template>
  <main>
    <form @submit.prevent="addMeeting()">
      <label for="meeting_title">{{ t('title') }}:</label><br/>
      <input id="meeting_title" type="text" v-model="formData.title" /><br/>
      <input type="checkbox" id="meeting_public" v-model="formData.public" /> <label for="meeting_public">{{ t('meeting.public') }}</label><br/>
      <btn icon="send" :disabled="disabled">{{ t('create') }}</btn>
    </form>
  </main>
</template>

<script>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { emitter, slugify } from '@/utils'

import meetingType from '@/contentTypes/meeting'

export default {
  name: 'AddMeetingModal',
  inject: ['t'],
  setup () {
    const router = useRouter()
    const meetingApi = meetingType.useContentApi()
    const formData = ref({
      title: '',
      public: false
    })
    const submitting = ref(false)

    const disabled = computed(_ => submitting.value || formData.value.title.length <= 5)

    function addMeeting () {
      if (submitting.value) return
      submitting.value = true
      meetingApi.add(formData.value)
        .then(({ data }) => {
          emitter.emit('modal-close')
          router.push(`/m/${data.pk}/${slugify(data.title)}`)
        })
    }

    return {
      formData,
      disabled,
      addMeeting
    }
  }
}
</script>
