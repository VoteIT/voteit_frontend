<template>
  <span v-if="!canChange && delegatedTo">
    <v-icon icon="mdi-arrow-right" />
    {{ delegatedTo.title }}
  </span>
  <span v-else-if="delegatedFrom.length">
    <DefaultDialog :title="t('meeting.groups.delegatedFrom', delegatedFrom.length)">
      <template #activator="{ props }">
        <v-chip
          v-bind="props"
          :text="t('meeting.groups.delegatedFrom', delegatedFrom.length)"
        />
      </template>
      <template #default="{ close }">
        <v-list>
          <v-list-item
            v-for="{ title, pk, votes } in delegatedFrom" :key="pk"
            prepend-icon="mdi-account-group"
            :title="title"
            :subtitle="t('poll.result.voteCount', votes || 0)"
          />
        </v-list>
        <div class="text-right">
          <v-btn variant="text" @click="close">
            {{ t('close') }}
          </v-btn>
        </div>
      </template>
    </DefaultDialog>
  </span>
  <v-select
    v-else-if="canChange && delegateOptions.length"
    v-model="modelValue"
    clearable
    hide-details
    density="compact"
    :items="delegateOptions"
    :label="t('meeting.groups.delegateTo')"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import useMeetingGroups from '../useMeetingGroups'
import { MeetingGroup } from '../types'
import useMeeting from '../useMeeting'
import { useI18n } from 'vue-i18n'
import { meetingGroupType } from '../contentTypes'
import DefaultDialog from '@/components/DefaultDialog.vue'
import useErrorHandler from '@/composables/useErrorHandler'

const props = defineProps<{ group: MeetingGroup }>()
const { t } = useI18n()

const { canChange, meetingId } = useMeeting()
const { meetingGroups, getMeetingGroup } = useMeetingGroups(meetingId)
const { handleRestError } = useErrorHandler({ showField: 'delegate_to', target: 'alert' })

const delegatedTo = computed(() => props.group.delegate_to ? getMeetingGroup(props.group.delegate_to) : undefined)
const delegatedFrom = computed(() => meetingGroups.value.filter(g => g.delegate_to === props.group.pk))
const delegateOptions = computed(() => meetingGroups.value.filter(g => g.pk !== props.group.pk && !g.delegate_to).map(({ title, pk }) => ({ title, value: pk })))

let submitting = false
const modelValue = computed({
  get () {
    return props.group.delegate_to
  },
  async set (value) {
    if (submitting) return
    submitting = true
    if (value === props.group.delegate_to) return
    try {
      await meetingGroupType.api.patch(
        props.group.pk, // FIXME
        { delegate_to: value }
      )
    } catch (e) {
      handleRestError(e)
    }
    submitting = false
  }
})
</script>
