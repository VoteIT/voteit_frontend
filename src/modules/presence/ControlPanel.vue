<template>
  <div>
    <header>
      <h2>{{ t('presence.manage') }}</h2>
    </header>
    <Widget v-if="currentCheck" selected>
      <PresenceCheckControl :check="currentCheck"/>
    </Widget>
    <Btn v-else-if="canStart" @click="startCheck()" icon="mdi-plus">{{ t('presence.newCheck') }}</Btn>
    <v-divider class="my-2" />
    <h2>{{ t('presence.recentlyClosedChecks') }}</h2>
    <v-sheet border rounded>
      <v-list>
        <v-list-item v-for="check in closedChecks" :key="check.pk">
          <div>
            <v-list-item-title class="mr-2">{{ t('presence.closedAt') }} <Moment ordinary :date="check.closed"/></v-list-item-title>
            <v-list-item-subtitle>{{ t('presence.presentCount', { count: getPresenceCount(check) }) }}</v-list-item-subtitle>
          </div>
        </v-list-item>
        <v-list-item v-if="!closedChecks.length">
          <em>{{ t('presence.noRecentlyClosedChecks') }}</em>
        </v-list-item>
      </v-list>
    </v-sheet>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import usePresence from '@/modules/presence/usePresence'
import useMeeting from '@/modules/meetings/useMeeting'

import Moment from '@/components/Moment.vue'
import PresenceCheckControl from '@/modules/presence/PresenceCheckControl.vue'
import { canAddPresenceCheck } from './rules'

export default defineComponent({
  components: { Moment, PresenceCheckControl },
  translationKey: 'presence.checks',
  path: 'presence',
  icon: 'mdi-hand-wave',
  setup () {
    const { t } = useI18n()
    const { getOpenPresenceCheck, getClosedPresenceChecks, openCheck, getPresenceCount } = usePresence()
    const { meetingId, meeting } = useMeeting()
    const submitting = ref(false)

    const currentCheck = computed(() => getOpenPresenceCheck(meetingId.value))
    const closedChecks = computed(() => getClosedPresenceChecks(meetingId.value))

    async function startCheck () {
      if (currentCheck.value) return
      submitting.value = true
      try {
        await openCheck(meetingId.value)
      } catch (err) {
        console.error(err)
      }
      submitting.value = false
    }

    const canStart = computed(() => meeting.value && canAddPresenceCheck(meeting.value))

    return {
      t,
      canStart,
      currentCheck,
      submitting,
      closedChecks,
      getPresenceCount,
      startCheck
    }
  }
})
</script>

<style lang="sass" scoped>
.dropdown
  float: right
</style>
