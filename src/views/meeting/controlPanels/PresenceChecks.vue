<template>
  <div>
    <header>
      <h2>{{ t('presence.manage') }}</h2>
    </header>
    <Widget v-if="currentCheck" selected>
      <PresenceCheckControl :check="currentCheck"/>
    </Widget>
    <Btn v-else-if="canAdd(meeting)" @click="startCheck()" icon="mdi-plus">{{ t('presence.newCheck') }}</Btn>
    <h3>{{ t('presence.recentlyClosedChecks') }}</h3>
    <Widget v-for="check in closedChecks" :key="check.pk">
      <p>{{ t('presence.closedAt') }} <Moment ordinary :date="check.closed"/></p>
    </Widget>
    <p v-if="!closedChecks.length"><em>{{ t('presence.noRecentlyClosedChecks') }}</em></p>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'

import usePresence from '@/composables/meeting/usePresence'
import useMeeting from '@/composables/meeting/useMeeting'

import presenceCheckType from '@/contentTypes/presenceCheck'

import Moment from '@/components/widgets/Moment.vue'
import PresenceCheckControl from '@/components/meeting/PresenceCheckControl.vue'
import { useI18n } from 'vue-i18n'
import { ControlPanelComponent } from './types'

export default defineComponent({
  components: { Moment, PresenceCheckControl },
  name: 'PresenceChecks',
  path: 'presence',
  icon: 'mdi-hand',
  setup () {
    const { t } = useI18n()
    const { getOpenPresenceCheck, getClosedPresenceChecks, openCheck } = usePresence()
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

    return {
      t,
      title: computed(() => t('presenceCheck')),
      ...presenceCheckType.rules,
      currentCheck,
      submitting,
      closedChecks,
      meeting,
      startCheck
    }
  }
}) as ControlPanelComponent
</script>

<style lang="sass" scoped>
.dropdown
  float: right
</style>
