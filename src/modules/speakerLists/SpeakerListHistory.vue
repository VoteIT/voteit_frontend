<script setup lang="ts">
import { Duration } from 'luxon'
import { computed, ref } from 'vue'

import { durationToString } from '@/utils'
import User from '@/components/User.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import DefaultDialog from '@/components/DefaultDialog.vue'
import DefaultForm from '@/components/DefaultForm.vue'
import QueryDialog from '@/components/QueryDialog.vue'
import DurationInput from '@/components/inputs/DurationInput.vue'

import useSpeakerList from './useSpeakerList'
import { SpeakerList } from './types'
import { speakerType } from './contentTypes'

const SPEAKER_HISTORY_CAP = 3

const props = defineProps<{
  list: SpeakerList
}>()

const { speakerHistory } = useSpeakerList(computed(() => props.list.pk))

const speakerHistoryExpanded = ref(false)
const speakerHistoryExpandable = computed(
  () => speakerHistory.value.length > SPEAKER_HISTORY_CAP
)
const annotatedSpeakerHistory = computed(() => {
  const history = speakerHistoryExpanded.value
    ? speakerHistory.value
    : speakerHistory.value.slice(0, SPEAKER_HISTORY_CAP)
  return history.map(({ pk, user, seconds }) => {
    return {
      pk,
      user,
      seconds,
      time: durationToString(Duration.fromMillis(seconds * 1000))
    }
  })
})

function timeSpokenHandler(pk: number) {
  return (data: { seconds: number }) => {
    return speakerType.api.patch(pk, data)
  }
}

async function deleteHistory(pk: number) {
  try {
    await speakerType.api.delete(pk)
  } catch {
    alert('^Could not delete spoken time entry')
  }
}
</script>

<template>
  <div v-if="list && annotatedSpeakerHistory.length">
    <h2>
      {{ $t('speaker.history') }}
    </h2>
    <v-list bg-color="background">
      <v-list-item
        v-for="{ pk, seconds, time, user } in annotatedSpeakerHistory"
        :key="pk"
      >
        <template #prepend>
          <UserAvatar :pk="user" />
        </template>
        <v-list-item-title>
          <User :pk="user" userid />
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ time }}
        </v-list-item-subtitle>
        <template #append>
          <span class="btn-group d-flex flex-nowrap">
            <DefaultDialog :title="$t('speaker.editSpeakerTime')">
              <template #activator="{ props }">
                <v-btn size="x-small" color="secondary" v-bind="props">
                  <v-icon icon="mdi-pencil" />
                </v-btn>
              </template>
              <template #default="{ close }">
                <DefaultForm
                  :handler="timeSpokenHandler(pk)"
                  :model-value="{ seconds }"
                  @done="close"
                  v-slot="{ formData }"
                >
                  <DurationInput v-model="formData.seconds" />
                </DefaultForm>
              </template>
            </DefaultDialog>
            <QueryDialog
              @confirmed="deleteHistory(pk)"
              :text="$t('speaker.confirmSpeakerDeletion')"
              color="warning"
            >
              <template #activator="{ props }">
                <v-btn size="x-small" color="warning" v-bind="props">
                  <v-icon icon="mdi-delete" />
                </v-btn>
              </template>
            </QueryDialog>
          </span>
        </template>
      </v-list-item>
      <v-btn
        v-if="speakerHistoryExpandable"
        :append-icon="`mdi-chevron-${speakerHistoryExpanded ? 'up' : 'down'}`"
        block
        :text="speakerHistoryExpanded ? $t('collapse') : $t('expand')"
        variant="text"
        @click="speakerHistoryExpanded = !speakerHistoryExpanded"
      />
    </v-list>
  </div>
</template>
