<template>
  <v-row>
    <v-col v-bind="cols.default">
      <template v-if="canManagePresence">
        <PresenceCheckControl class="text-center" />
        <v-divider class="my-4" />
      </template>
      <h1>
        {{ t('electoralRegister.plural') }}
      </h1>
      <template v-for="{ description, title, registers } in groups" :key="title">
        <h2 class="mt-6">
          {{ title }}
        </h2>
        <p v-if="description" class="text-secondary">
          {{ description }}
        </p>
        <p v-if="!registers.length" class="text-secondary my-4"><em>
          {{ t('electoralRegister.none') }}
        </em></p>
        <v-expansion-panels class="mt-3">
          <v-expansion-panel v-for="{ pk, created, voters } in registers" :key="pk">
            <v-expansion-panel-title class="d-flex">
              <span class="text-left" style="min-width: 92px;">
                {{ t('electoralRegister.voterCount', voters.length) }}
              </span>
              <small class="text-secondary flex-grow-1">
                {{ created.toLocaleString(undefined, { dateStyle: 'long' }) }},
                {{ created.toLocaleString(undefined, { timeStyle: 'short' }) }}
              </small>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <UserList :userIds="voters" />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </template>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

import UserList from '@/components/UserList.vue'
import useLoader from '@/composables/useLoader'
import useElectoralRegisters from '../useElectoralRegisters'
import useMeeting from '../useMeeting'
import usePresence from '@/modules/presence/usePresence'
import { presenceCheckClosed } from '@/modules/presence/events'
import usePolls from '@/modules/polls/usePolls'
import { PollState } from '@/modules/polls/types'
import { ElectoralRegister } from '@/contentTypes/types'

export default defineComponent({
  inject: ['cols'],
  components: {
    UserList
  },
  setup () {
    const { t } = useI18n()
    const { meetingId } = useMeeting()
    const { fetchRegisters, sortedRegisters } = useElectoralRegisters()
    const loader = useLoader('ElectoralRegisters')
    const { canManagePresence } = usePresence()
    const { filterPolls } = usePolls()

    async function getData () {
      await fetchRegisters(meetingId.value)
    }

    const registerGroups = computed(() => {
      const ongoing: ElectoralRegister[] = []
      const historic: ElectoralRegister[] = []
      sortedRegisters.value
        .slice(1) // Exclude latest from this group
        .forEach(er => {
          const hasOngoing = !filterPolls(poll => poll.meeting === meetingId.value && poll.state === PollState.Ongoing && poll.electoral_register === er.pk).next().done
          if (hasOngoing) ongoing.push(er)
          else historic.push(er)
        })
      return { ongoing, historic }
    })

    const groups = computed(() => {
      return [
        {
          title: t('electoralRegister.latest'),
          registers: sortedRegisters.value.slice(0, 1)
        },
        {
          title: t('electoralRegister.active'),
          description: t('electoralRegister.activeDescription'),
          registers: registerGroups.value.ongoing
        },
        {
          title: t('electoralRegister.previous'),
          registers: registerGroups.value.historic
        }
      ]
    })

    onBeforeMount(() => {
      loader.call(getData)
      presenceCheckClosed.on(getData)
    })
    onBeforeUnmount(() => {
      presenceCheckClosed.off(getData)
    })

    return {
      t,
      canManagePresence,
      groups,
      fetchRegisters
    }
  }
})
</script>
