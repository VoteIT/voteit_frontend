<template>
  <MeetingToolbar>
    <v-toolbar-title>
      {{ t('electoralRegister.plural') }}
    </v-toolbar-title>
    <DefaultDialog
      v-if="canTriggerERCreation"
      :title="t('electoralRegister.establish')"
      @open="triggerERCreation"
    >
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          color="primary"
          variant="tonal"
          prepend-icon="mdi-star-check"
        >
          {{ t('electoralRegister.establish') }}
        </v-btn>
      </template>
      <template #default="{ close }">
        <div class="text-center py-4" v-if="erTriggerResult === 'waiting'">
          <v-progress-circular color="primary" indeterminate />
        </div>
        <v-alert
          v-else
          class="mb-2"
          :icon="erTriggerResult === 'failed' ? undefined : 'mdi-vote'"
          :type="erTriggerResult === 'failed' ? 'warning' : undefined"
          :title="erTriggerResultText"
          :text="currentERText"
        />
        <div class="text-right">
          <v-btn
            color="primary"
            :disabled="erTriggerResult === 'waiting'"
            @click="close"
            prepend-icon="mdi-close"
          >
            {{ t('close') }}
          </v-btn>
        </div>
      </template>
    </DefaultDialog>
    <DefaultDialog
      v-if="erMethodAllowsManual && isModerator && isActiveMeeting"
      :title="t('electoralRegister.createManual')"
      @open="fetchRoles"
    >
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          variant="tonal"
          prepend-icon="mdi-book-open-variant"
        >
          {{ t('electoralRegister.createManual') }}
        </v-btn>
      </template>
      <template #default="{ close }">
        <v-alert
          type="info"
          class="my-2"
          :text="t('electoralRegister.createHelp')"
        />
        <div>
          <!-- <v-text-field v-if="setVoteWeight" type="number" min="0" max="6" v-model="decimalPlaces" label="Antal decimaler" /> -->
          <v-chip>{{ t('selectedCount', createSelection.size) }}</v-chip>
        </div>
        <UserList
          multiple
          :userIds="potentialVoters"
          v-model="selectedUsers"
          density="default"
          class="mb-4"
        >
          <template #appendItem="{ user, isSelected }">
            <div v-if="isSelected">
              <v-text-field
                v-if="erMethodWeighted"
                class="er-weight"
                density="compact"
                hide-details
                :label="t('electoralRegister.weight')"
                required
                :min="minWeight"
                :model-value="createSelection.get(user)"
                :step="minWeight"
                type="number"
                variant="solo"
                @click.stop
                @keydown.stop
                @update:modelValue="createSelection.set(user, round($event))"
              />
              <v-icon v-else>mdi-check-circle</v-icon>
            </div>
          </template>
        </UserList>
        <div class="text-right">
          <v-btn variant="text" @click="close">
            {{ t('cancel') }}
          </v-btn>
          <v-btn
            prepend-icon="mdi-account-plus"
            color="primary"
            @click="createRegister().then(close)"
            :disabled="createSelection.size === 0"
          >
            {{ t('create') }}
          </v-btn>
        </div>
      </template>
    </DefaultDialog>
  </MeetingToolbar>
  <v-row>
    <v-col v-bind="cols.default">
      <template
        v-for="{ description, title, registers } in groups"
        :key="title"
      >
        <h2 class="mt-6">
          {{ title }}
        </h2>
        <p v-if="description" class="text-secondary">
          {{ description }}
        </p>
        <p v-if="!registers.length" class="text-secondary my-4">
          <em>
            {{ t('electoralRegister.none') }}
          </em>
        </p>
        <v-expansion-panels class="mt-3">
          <v-expansion-panel
            v-for="{
              pk,
              created,
              hasWeightedVotes,
              weights,
              source
            } in registers"
            :key="pk"
          >
            <v-expansion-panel-title class="d-flex">
              <span class="text-left mr-2" style="min-width: 92px">
                {{ t('electoralRegister.voterCount', weights.length) }}
              </span>
              <small class="text-secondary flex-grow-1">
                <span v-if="source">
                  {{ getErMethod(source)?.title || source }},
                </span>
                {{
                  DateTime.fromISO(created).toLocaleString(
                    DateTime.DATETIME_SHORT
                  )
                }}
              </small>
            </v-expansion-panel-title>
            <v-expansion-panel-text v-if="weights.length">
              <div v-if="isModerator" class="text-right">
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      prepend-icon="mdi-download"
                      color="primary"
                      variant="tonal"
                    >
                      {{ t('download') }}
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item
                      :href="getDownloadUrl(pk, 'csv')"
                      prepend-icon="mdi-file-download"
                      :title="`${t(
                        'electoralRegister.electoralRegister'
                      )} (CSV)`"
                    />
                    <v-list-item
                      :href="getDownloadUrl(pk, 'json')"
                      prepend-icon="mdi-file-download"
                      :title="`${t(
                        'electoralRegister.electoralRegister'
                      )} (JSON)`"
                    />
                  </v-list>
                </v-menu>
              </div>
              <UserList :userIds="weights.map((v) => v.user)">
                <template #appendItem="{ user }" v-if="hasWeightedVotes">
                  <v-chip>
                    {{ t('electoralRegister.weight') }}:
                    {{ weights.find((w) => w.user === user)?.weight }}
                  </v-chip>
                </template>
              </UserList>
            </v-expansion-panel-text>
            <v-expansion-panel-text v-else class="pt-2 text-center">
              <em> - {{ t('electoralRegister.empty') }} - </em>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </template>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { partition } from 'itertools'
import { DateTime } from 'luxon'
import {
  computed,
  onBeforeMount,
  onBeforeUnmount,
  reactive,
  ref,
  watch
} from 'vue'
import { useI18n } from 'vue-i18n'

import restApi from '@/utils/restApi'
import { socket } from '@/utils/Socket'
import DefaultDialog from '@/components/DefaultDialog.vue'
import UserList from '@/components/UserList.vue'
import useDefaults from '@/composables/useDefaults'
import useLoader from '@/composables/useLoader'
import { presenceCheckClosed } from '@/modules/presence/events'
import usePolls from '@/modules/polls/usePolls'
import { PollState } from '@/modules/polls/types'

import useMeeting from '../useMeeting'
import useMeetingTitle from '../useMeetingTitle'
import { MeetingRole } from '../types'
import { electoralRegisterType, meetingType } from '../contentTypes'
import MeetingToolbar from '../MeetingToolbar.vue'
import useElectoralRegisters from './useElectoralRegisters'

const { t } = useI18n()
const { getRoleUserIds } = meetingType.useContextRoles()
const { isActiveMeeting, isModerator, meetingId } = useMeeting()
const {
  sortedRegisters,
  currentElectoralRegister,
  erMethod,
  erMethodWeighted,
  fetchRegisters,
  getErMethod,
  hasWeightedVotes,
  erMethodAllowsManual
} = useElectoralRegisters(meetingId)
const loader = useLoader('ElectoralRegisters')
const { anyPoll } = usePolls()

useMeetingTitle(t('electoralRegister.plural'))

function getDownloadUrl(register: number, type: 'csv' | 'json') {
  return `${restApi.defaults.baseURL}export-electoral-register/${register}/${type}/`
}

const groups = computed(() => {
  const [ongoing, historic] = partition(sortedRegisters.value.slice(1), (er) =>
    anyPoll(
      (poll) =>
        poll.state === PollState.Ongoing && poll.electoral_register === er.pk
    )
  )
  return [
    {
      title: t('electoralRegister.latest'),
      registers: sortedRegisters.value.slice(0, 1)
    },
    {
      title: t('electoralRegister.active'),
      description: t('electoralRegister.activeDescription'),
      registers: ongoing
    },
    {
      title: t('electoralRegister.previous'),
      registers: historic
    }
  ]
})

function getInitialSelection() {
  return new Map(
    currentElectoralRegister.value?.weights
      .filter((w) => potentialVoters.value.includes(w.user))
      .map((w) => [w.user, w.weight])
  )
}

const decimalPlaces = ref(0) // Maybe TODO
const potentialVoters = computed(() =>
  getRoleUserIds(meetingId.value, MeetingRole.PotentialVoter)
)
const createSelection = reactive(getInitialSelection())
const selectedUsers = computed({
  get() {
    return [...createSelection.keys()]
  },
  set(values: number[]) {
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
const toInteger = (weight: number) =>
  Math.round(weight * weightMultiplier.value)
const round = (weight: number | string) =>
  weight ? Number(Number(weight).toFixed(decimalPlaces.value)) : 1
const minWeight = computed(() => toFractions(1))

watch(decimalPlaces, () => {
  for (const [user, weight] of createSelection.entries()) {
    createSelection.set(user, round(weight))
  }
})

// Update create selection if current ER or potential voter list changes (usually when initially loaded)
function updateCreateSelection() {
  createSelection.clear()
  if (!currentElectoralRegister.value) return
  for (const { user, weight } of currentElectoralRegister.value.weights) {
    if (potentialVoters.value.includes(user))
      createSelection.set(user, toFractions(weight))
  }
}
watch(currentElectoralRegister, updateCreateSelection)
watch(potentialVoters, updateCreateSelection)

async function createRegister() {
  if (!erMethod.value) return
  const weights = [...createSelection.entries()].map(([user, weight]) => ({
    user,
    weight: toInteger(weight)
  }))
  try {
    await electoralRegisterType.methodCall('manual_create', {
      meeting: meetingId.value,
      weights
    })
    return true
  } catch {
    // TODO
    alert('*Could not create electoral register')
    return false
  }
}

onBeforeMount(() => {
  loader.call(fetchRegisters)
  presenceCheckClosed.on(fetchRegisters)
})
onBeforeUnmount(() => {
  presenceCheckClosed.off(fetchRegisters)
})

function fetchRoles() {
  meetingType.fetchRoles(meetingId.value)
}

// Trigger ER creation for some ER methods (w allow_trigger)
const canTriggerERCreation = computed(
  () =>
    !!(
      isModerator.value &&
      erMethod.value?.allow_trigger &&
      isActiveMeeting.value
    )
)
const erTriggerResult = ref<'waiting' | 'created' | 'up2date' | 'failed'>(
  'waiting'
)
async function triggerERCreation() {
  if (!canTriggerERCreation.value) throw new Error('ER creation not allowed')
  erTriggerResult.value = 'waiting'
  try {
    const { p } = await socket.call<{ created: boolean }>('er.trigger_create', {
      meeting: meetingId.value
    })
    erTriggerResult.value = p.created ? 'created' : 'up2date'
  } catch {
    erTriggerResult.value = 'failed'
  }
}
const erTriggerResultText = computed(() => {
  switch (erTriggerResult.value) {
    case 'created':
      return t('electoralRegister.created')
    case 'failed':
      return t('electoralRegister.failed')
    case 'up2date':
      return t('electoralRegister.upToDate')
  }
  return undefined
})
const currentERText = computed(() => {
  if (!currentElectoralRegister.value || erTriggerResult.value === 'failed')
    return
  const { weights } = currentElectoralRegister.value
  return hasWeightedVotes(currentElectoralRegister.value)
    ? t('electoralRegister.weightedVoterCount', {
        count: weights.length,
        total: weights.reduce((curr, w) => curr + w.weight, 0)
      })
    : t('electoralRegister.voterCount', weights.length)
})

const { cols } = useDefaults()
</script>

<style scoped lang="sass">
.er-weight
  min-width: 80px
</style>
