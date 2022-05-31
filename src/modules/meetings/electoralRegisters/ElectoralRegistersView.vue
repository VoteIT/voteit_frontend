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
        <!-- WIP TODO FIXME -->
        <div v-if="erMethod?.allowManual">
          <v-dialog @update:modelValue="$event && fetchRoles()">
            <template #activator="{ props }">
              <v-btn v-bind="props" color="primary" prepend-icon="mdi-account-plus">
                {{ t('electoralRegister.create') }}
              </v-btn>
            </template>
            <template v-slot="{ isActive }">
              <v-sheet v-bind="dialogDefaults" class="pa-4">
                <h2 class="mb-2">
                  {{ t('electoralRegister.create') }}
                </h2>
                <v-alert type="info" class="my-2" :text="t('electoralRegister.createHelp')" />
                <div class="d-flex align-center">
                  <!-- <v-text-field v-if="setVoteWeight" type="number" min="0" max="6" v-model="decimalPlaces" label="Antal decimaler" /> -->
                  <v-chip>{{ t('selectedCount', createSelection.size) }}</v-chip>
                  <v-spacer />
                  <v-switch v-model="setVoteWeight" color="primary" label="Använd viktade röster" hide-details class="flex-grow-0" />
                </div>
                <UserList multiple :userIds="potentialVoters" v-model="selectedUsers" density="default" class="mb-4">
                  <template #appendItem="{ user, isSelected }">
                    <div v-if="isSelected" @click.stop>
                      <v-text-field v-if="setVoteWeight" density="compact" required :min="minWeight" :step="minWeight" :label="t('electoralRegister.weight')" type="number" :model-value="createSelection.get(user)" @update:modelValue="createSelection.set(user, round($event))" hide-details />
                      <v-icon v-else>mdi-check-circle</v-icon>
                    </div>
                  </template>
                </UserList>
                <div class="text-right">
                  <v-btn variant="text" @click="isActive.value = false">
                    {{ t('cancel') }}
                  </v-btn>
                  <v-btn prepend-icon="mdi-account-plus" color="primary" @click="createRegister(isActive)" :disabled="createSelection.size === 0">
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
          <v-expansion-panel v-for="{ pk, created, weights, source } in registers" :key="pk">
            <v-expansion-panel-title class="d-flex">
              <span class="text-left" style="min-width: 92px;">
                {{ t('electoralRegister.voterCount', weights.length) }}
              </span>
              <small class="text-secondary flex-grow-1">
                <span v-if="source">
                  {{ t(`erMethods.${source}.title`) }},
                </span>
                {{ created.toLocaleString(undefined, { dateStyle: 'long' }) }},
                {{ created.toLocaleString(undefined, { timeStyle: 'short' }) }}
              </small>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <UserList :userIds="weights.map(v => v.user)">
                <template #appendItem="{ user }" v-if="source === 'manual'">
                  <v-chip>
                    {{ t('electoralRegister.weight') }}: {{ weights.find(w => w.user === user).weight }}
                  </v-chip>
                </template>
              </UserList>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </template>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, onBeforeUnmount, reactive, Ref, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import UserList from '@/components/UserList.vue'
import useLoader from '@/composables/useLoader'
import useMeeting from '../useMeeting'
import usePresence from '@/modules/presence/usePresence'
import { presenceCheckClosed } from '@/modules/presence/events'
import usePolls from '@/modules/polls/usePolls'
import { PollState } from '@/modules/polls/types'
import useDefaults from '@/composables/useDefaults'
import { MeetingRole } from '../types'
import { electoralRegisterType, meetingType } from '../contentTypes'
import { ElectoralRegister } from './types'
import useElectoralRegisters from './useElectoralRegisters'

export default defineComponent({
  inject: ['cols'],
  components: {
    UserList
  },
  setup () {
    const { t } = useI18n()
    const { getRoleUserIds } = meetingType.useContextRoles()
    const { meetingId } = useMeeting()
    const { sortedRegisters, currentElectoralRegister, erMethod, fetchRegisters, hasWeightedVotes } = useElectoralRegisters(meetingId)
    const loader = useLoader('ElectoralRegisters')
    const { canManagePresence } = usePresence(meetingId)
    const { filterPolls } = usePolls()

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

    const decimalPlaces = ref(0) // Maybe TODO
    const setVoteWeight = ref(!currentElectoralRegister.value || hasWeightedVotes(currentElectoralRegister.value))
    const potentialVoters = computed(() => getRoleUserIds(meetingId.value, MeetingRole.PotentialVoter))
    const createSelection = reactive(new Map(currentElectoralRegister.value?.weights.map(w => [w.user, w.weight]) ?? []))
    const selectedUsers = computed({
      get () {
        return [...createSelection.keys()]
      },
      set (values: number[]) {
        for (const pk of createSelection.keys()) {
          if (!values.includes(pk)) createSelection.delete(pk)
        }
        for (const pk of values) {
          if (!createSelection.has(pk)) createSelection.set(pk, 1)
        }
      }
    })
    const weightMultiplier = computed(() => {
      if (decimalPlaces.value === 0) return 1
      return 10 ** decimalPlaces.value
    })
    const toFractions = (weight: number) => weight / weightMultiplier.value
    const toInteger = (weight: number) => Math.round(weight * weightMultiplier.value)
    const round = (weight: number) => weight ? Number(weight.toFixed(decimalPlaces.value)) : 1
    const minWeight = computed(() => toFractions(1))

    watch(decimalPlaces, () => {
      for (const [user, weight] of createSelection.entries()) {
        createSelection.set(user, round(weight))
      }
    })
    watch(currentElectoralRegister, register => {
      createSelection.clear()
      if (!register) return
      for (const w of register.weights) {
        createSelection.set(w.user, toFractions(w.weight))
      }
      setVoteWeight.value = hasWeightedVotes(register)
    })
    watch(setVoteWeight, value => {
      if (value) return
      for (const user of createSelection.keys()) {
        createSelection.set(user, 1)
      }
    })

    function createRegister (isActive: Ref<boolean>) {
      if (!erMethod.value) return
      const weights = [...createSelection.entries()]
        .map(([user, weight]) => ({ user, weight: toInteger(weight) }))
      try {
        electoralRegisterType.methodCall('manual_create', {
          meeting: meetingId.value,
          weights
        })
        isActive.value = false
      } catch {
        // TODO
        alert('*Could not create electoral register')
      }
    }

    onBeforeMount(() => {
      loader.call(fetchRegisters)
      presenceCheckClosed.on(fetchRegisters)
    })
    onBeforeUnmount(() => {
      presenceCheckClosed.off(fetchRegisters)
    })

    return {
      t,
      canManagePresence,
      createSelection,
      currentElectoralRegister,
      decimalPlaces,
      erMethod,
      groups,
      minWeight,
      potentialVoters,
      selectedUsers,
      setVoteWeight,
      createRegister,
      fetchRegisters,
      fetchRoles: () => meetingType.fetchRoles(meetingId.value),
      round,
      // selectUser,
      ...useDefaults()
    }
  }
})
</script>
