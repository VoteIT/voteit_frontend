<template>
  <div>
    <header>
      <h2>{{ t('presence.manage') }}</h2>
    </header>
    <Widget v-if="presenceCheck" selected>
      <PresenceCheckControl />
    </Widget>
    <v-btn v-else-if="canStart" @click="startCheck()" prepend-icon="mdi-plus">
      {{ t('presence.newCheck') }}
    </v-btn>
    <v-divider class="my-2" />
    <h2>{{ t('presence.recentlyClosedChecks') }}</h2>
    <v-sheet border rounded>
      <v-list>
        <v-list-item v-for="check in closedPresenceChecks" :key="check.pk">
          <div>
            <v-list-item-title class="mr-2">{{ t('presence.closedAt') }} <Moment ordinary :date="check.closed"/></v-list-item-title>
            <v-list-item-subtitle>{{ t('presence.presentCount', presenceCount) }}</v-list-item-subtitle>
          </div>
        </v-list-item>
        <v-list-item v-if="!closedPresenceChecks.length">
          <em>{{ t('presence.noRecentlyClosedChecks') }}</em>
        </v-list-item>
      </v-list>
    </v-sheet>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Moment from '@/components/Moment.vue'

import usePresence from './usePresence'
import useMeeting from '../meetings/useMeeting'

export default defineComponent({
  components: {
    Moment
  },
  translationKey: 'presence.checks',
  path: 'presence',
  icon: 'mdi-hand-wave',
  setup () {
    const { t } = useI18n()
    const { meetingId } = useMeeting()
    const { canManagePresence, closedPresenceChecks, openCheck, presenceCheck, presenceCount } = usePresence(meetingId)
    const submitting = ref(false)

    async function startCheck () {
      if (presenceCheck.value) return
      submitting.value = true
      try {
        await openCheck()
      } catch (err) {
        console.error(err)
      }
      submitting.value = false
    }

    return {
      t,
      canManagePresence,
      presenceCheck,
      submitting,
      closedPresenceChecks,
      presenceCount,
      startCheck
    }
  }
})
</script>

<style lang="sass" scoped>
.dropdown
  float: right
</style>
