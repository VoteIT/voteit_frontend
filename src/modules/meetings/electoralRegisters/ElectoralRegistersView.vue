<template>
  <v-row>
    <v-col v-bind="cols.default">
      <!-- <template v-if="canManagePresence">
        <PresenceCheckControl class="text-center" />
        <v-divider class="my-4" />
      </template> -->
      <div class="d-flex">
        <h1 class="flex-grow-1">
          {{ t('electoralRegister.plural') }}
        </h1>
        <div>
          <v-dialog @update:modelValue="$event && fetchRoles()">
            <template #activator="{ props }">
              <v-btn v-bind="props" color="primary" prepend-icon="mdi-account-plus">
                Skapa röstlängd
              </v-btn>
            </template>
            <template v-slot="{ isActive }">
              <v-sheet v-bind="dialogDefaults" class="pa-4">
                <h2>Ny röstlängd</h2>
                <v-alert type="info" class="my-2">
                  Välj vilka av mötets potentiella röstare som ska ingå i röstlängden.
                </v-alert>
                <UserList :userIds="potentialVoters" class="mb-4" @clickItem="selectUser($event)">
                  <template #appendItem="{ user }">
                    <div>
                      <v-checkbox :model-value="createSelection.has(user)" @update:modelValue="selectUser(user, $event)" hide-details />
                    </div>
                  </template>
                </UserList>
                <div class="text-right">
                  <v-btn variant="text" @click="isActive.value = false">
                    {{ t('cancel') }}
                  </v-btn>
                  <v-btn prepend-icon="mdi-account-plus" color="primary" @click="createRegister()" :disabled="createSelection.size === 0">
                    {{ t('create') }}
                  </v-btn>
                </div>
              </v-sheet>
            </template>
          </v-dialog>
        </div>
      </div>
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
          <v-expansion-panel v-for="{ pk, created, weights } in registers" :key="pk">
            <v-expansion-panel-title class="d-flex">
              <span class="text-left" style="min-width: 92px;">
                {{ t('electoralRegister.voterCount', weights.length) }}
              </span>
              <small class="text-secondary flex-grow-1">
                {{ created.toLocaleString(undefined, { dateStyle: 'long' }) }},
                {{ created.toLocaleString(undefined, { timeStyle: 'short' }) }}
              </small>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <UserList :userIds="weights.map(v => v.user)" />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </template>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, onBeforeUnmount, reactive, watch } from 'vue'
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
import useDefaults from '@/composables/useDefaults'
import { MeetingRole } from '../types'
import { meetingType } from '../contentTypes'

export default defineComponent({
  inject: ['cols'],
  components: {
    UserList
  },
  setup () {
    const { t } = useI18n()
    const { getRoleUserIds } = meetingType.useContextRoles()
    const { meetingId } = useMeeting()
    const { fetchRegisters, sortedRegisters, currentElectoralRegister } = useElectoralRegisters()
    const loader = useLoader('ElectoralRegisters')
    const { canManagePresence } = usePresence(meetingId)
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

    const potentialVoters = computed(() => getRoleUserIds(meetingId.value, MeetingRole.PotentialVoter))
    const createSelection = reactive(new Set(currentElectoralRegister.value?.weights.map(w => w.user) ?? []))
    watch(currentElectoralRegister, register => {
      createSelection.clear()
      if (!register) return
      for (const w of register.weights) {
        createSelection.add(w.user)
      }
    })

    function selectUser (user: number, value?: boolean) {
      if (value === undefined) value = !createSelection.has(user)
      createSelection[value ? 'add' : 'delete'](user)
    }

    function createRegister () {
      console.log('CREATE', createSelection)
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
      canManagePresence,
      createSelection,
      currentElectoralRegister,
      groups,
      potentialVoters,
      createRegister,
      fetchRegisters,
      fetchRoles: () => meetingType.fetchRoles(meetingId.value),
      selectUser,
      ...useDefaults()
    }
  }
})
</script>
