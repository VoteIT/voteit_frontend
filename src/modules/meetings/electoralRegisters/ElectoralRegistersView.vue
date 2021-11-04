<template>
  <v-row>
    <v-col v-bind="cols.default">
      <template v-if="canPresenceCheck">
        <presenceCheckControl v-if="activePresenceCheck" :check="activePresenceCheck" subscribe class="text-center" />
        <div v-else class="text-center my-8">
          <v-btn size="large" color="primary" @click="openCheck(meetingId)" prepend-icon="mdi-hand-wave">
            {{ t('presence.newCheck') }}
          </v-btn>
        </div>
        <v-divider class="my-4" />
      </template>
      <h1>
        {{ t('electoralRegister.plural') }}
      </h1>
      <!-- <h2>
        {{ t('active') }}
      </h2> -->
      <v-expansion-panels class="mt-4">
        <v-expansion-panel v-for="{ pk, created, voters } in sortedRegisters" :key="pk">
          <v-expansion-panel-title class="d-flex">
            {{ t('electoralRegister.voterCount', voters.length) }}
            <Moment :date="created" class="mr-4 flex-grow-1" />
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list>
              <v-list-item v-for="pk in voters" :key="pk">
                <v-list-item-avatar class="mr-2">
                  <UserAvatar :pk="pk" />
                </v-list-item-avatar>
                <v-list-item-title>
                  <User :pk="pk" />
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

import Moment from '@/components/Moment.vue'
import useLoader from '@/composables/useLoader'
import useElectoralRegisters from '../useElectoralRegisters'
import useMeeting from '../useMeeting'
import { canAddPresenceCheck } from '@/modules/presence/rules'
import PresenceCheckControl from '../../presence/PresenceCheckControl.vue'
import usePresence from '@/modules/presence/usePresence'
import { presenceCheckClosed } from '@/modules/presence/events'

export default defineComponent({
  inject: ['cols'],
  components: {
    Moment,
    PresenceCheckControl
  },
  setup () {
    const { t } = useI18n()
    const { meetingId, meeting } = useMeeting()
    const { fetchRegisters, sortedRegisters } = useElectoralRegisters()
    const loader = useLoader('ElectoralRegisters')
    const { openCheck, getOpenPresenceCheck } = usePresence()

    const canPresenceCheck = computed(() => meeting.value && canAddPresenceCheck(meeting.value))
    const activePresenceCheck = computed(() => getOpenPresenceCheck(meetingId.value))

    async function getData () {
      await fetchRegisters(meetingId.value)
    }

    onBeforeMount(() => {
      loader.call(getData)
      presenceCheckClosed.on(getData)
    })
    onBeforeUnmount(() => {
      presenceCheckClosed.off(getData)
    })

    return {
      t,
      activePresenceCheck,
      canPresenceCheck,
      meetingId,
      sortedRegisters,
      fetchRegisters,
      openCheck
    }
  }
})
</script>
