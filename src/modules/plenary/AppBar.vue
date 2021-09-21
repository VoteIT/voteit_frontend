<template>
  <v-app-bar app flat>
    <v-app-bar-title>
      <router-link to="/" :title="t('home.home')" class="mr-4">
        <img :src="require('@/assets/voteit-logo.svg').default" alt="VoteIT" />
      </router-link>
      <router-link v-if="agendaItem" :to="agendaItemPath">
        {{ agendaItem.title }}
      </router-link>
    </v-app-bar-title>
    <div v-if="agendaItem">
      <v-btn variant="text" :disabled="!previousAgendaItem" :to="previousAgendaItem ? `/p/${meetingId}/${previousAgendaItem.pk}` : '/'" icon="mdi-chevron-left" />
      <v-btn variant="text" :disabled="!nextAgendaItem" :to="nextAgendaItem ? `/p/${meetingId}/${nextAgendaItem.pk}` : '/'" icon="mdi-chevron-right" />
    </div>
  </v-app-bar>
</template>

<script lang="ts">
import useMeeting from '@/modules/meetings/useMeeting'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import useAgenda from '@/modules/agendas/useAgenda'
import useAgendaItem from '@/modules/agendas/useAgendaItem'

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const { previousAgendaItem, nextAgendaItem } = useAgenda()
    const { agendaItem, agendaItemPath } = useAgendaItem()
    const { meetingId, meetingPath } = useMeeting()

    return {
      t,
      agendaItem,
      agendaItemPath,
      previousAgendaItem,
      meetingId,
      meetingPath,
      nextAgendaItem
    }
  }
})
</script>

<style lang="sass" scoped>
a
  text-decoration: none
  color: rgb(var(--v-theme-on-app-bar))
</style>
