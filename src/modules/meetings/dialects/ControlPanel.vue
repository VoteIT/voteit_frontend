<script setup lang="ts">
import { computed, shallowRef, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

import QueryDialog from '@/components/QueryDialog.vue'
import useErrorHandler from '@/composables/useErrorHandler'

import useMeeting from '../useMeeting'
import { translateMeetingRole } from '../utils'
import useDialects from './useDialects'
import { meetingType } from '../contentTypes'
import { MeetingState } from '../types'

const { t } = useI18n()
const { meeting, meetingDialect, meetingId } = useMeeting()
const { handled, handler } = useErrorHandler({ target: 'dialog' })
const { installableDialects, loadDialects } = useDialects()

const isUpcomingMeeting = computed(
  () => meeting.value?.state === MeetingState.Upcoming
)

// Fetch if no dialect loaded (might trigger early on page reload, that's ok)
const loading = shallowRef(false)
const stopWatch = watchEffect(async () => {
  if (meetingDialect.value || !isUpcomingMeeting.value) return
  loading.value = true
  await handled(async () => {
    await loadDialects()
    stopWatch()
  })
  loading.value = false
})

function* getDialectDefines() {
  const d = meetingDialect.value
  if (!d) return
  if (d.group_roles_active)
    yield {
      'prepend-icon': 'mdi-account-group',
      title: t('meeting.dialectGroupRoles'),
      subtitle: d.roles.map((r) => r.title).join(', ')
    }
  if (d.group_votes_active)
    yield { 'prepend-icon': 'mdi-vote', title: t('meeting.dialectGroupVotes') }
  if (d.block_roles)
    yield {
      'prepend-icon': 'mdi-account-check',
      title: t('meeting.dialectHandlesMeetingRoles', d.block_roles.length),
      subtitle: d.block_roles
        .map((role) => translateMeetingRole(role, t))
        .join(', ')
    }
}

const dialectDefines = computed(() => [...getDialectDefines()])

const installDialect = handler(
  (dialect: string) =>
    meetingType.api.action('install-dialect', meetingId.value, { dialect }),
  'dialect'
)

const removeDialect = handler(
  () => meetingType.api.action('remove-dialect', meetingId.value),
  'dialect'
)
</script>

<template>
  <div v-if="meetingDialect">
    <header class="mb-3">
      <h1>
        {{ meetingDialect.title }}
      </h1>
      <p>
        {{ meetingDialect.description }}
      </p>
    </header>
    <v-list bg-color="background" class="mb-3">
      <v-list-item
        v-for="(props, i) in dialectDefines"
        :key="i"
        v-bind="props"
      />
    </v-list>
    <v-card
      v-if="isUpcomingMeeting"
      color="warning"
      elevation="0"
      prepend-icon="mdi-alert"
      :title="$t('meeting.dialects.uninstallTitle')"
      :text="$t('meeting.dialects.uninstallText')"
    >
      <template #actions>
        <QueryDialog
          color="warning"
          :text="
            $t('meeting.dialects.uninstallConfirm', {
              title: meetingDialect.title
            })
          "
          @confirmed="removeDialect"
        >
          <template #activator="{ props }">
            <v-btn
              prepend-icon="mdi-undo"
              :text="$t('meeting.dialects.uninstallTitle')"
              v-bind="props"
            />
          </template>
        </QueryDialog>
      </template>
    </v-card>
    <v-alert v-else :text="$t('meeting.dialects.changeOnlyUpcoming')" />
  </div>
  <div v-else class="d-flex flex-column ga-3">
    <v-card
      elevation="0"
      :loading="loading"
      prepend-icon="mdi-brush-variant"
      :text="$t('meeting.dialects.installDescription')"
      :title="$t('meeting.dialect')"
      color="info"
    />
    <v-alert
      v-if="!isUpcomingMeeting"
      :text="$t('meeting.dialects.changeOnlyUpcoming')"
    />
    <v-card
      v-for="{ description, name, title } in installableDialects"
      :key="name"
      :subtitle="description"
      :title="title"
    >
      <template #actions>
        <QueryDialog
          @confirmed="installDialect(name)"
          :text="$t('meeting.dialects.installConfirm', { title })"
          color="warning"
        >
          <template #activator="{ props }">
            <v-btn
              :text="$t('meeting.dialects.installBtn', { title })"
              prepend-icon="mdi-download-circle"
              v-bind="props"
            />
          </template>
        </QueryDialog>
      </template>
    </v-card>
  </div>
</template>
