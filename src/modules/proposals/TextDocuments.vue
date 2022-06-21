<template>
  <div>
    <TextDocument v-for="doc in documents" :key="doc.pk" :document="doc" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

import useAgenda from '../agendas/useAgenda'
import useMeeting from '../meetings/useMeeting'

import TextDocument from './TextDocument.vue'
import useTextDocuments from './useTextDocuments'

export default defineComponent({
  components: {
    TextDocument
  },
  setup () {
    const { meetingId } = useMeeting()
    const { agendaId } = useAgenda(meetingId)
    const { getDocuments } = useTextDocuments()
    const documents = computed(() => getDocuments((doc) => doc.agenda_item === agendaId.value))

    return {
      documents
    }
  }
})
</script>
