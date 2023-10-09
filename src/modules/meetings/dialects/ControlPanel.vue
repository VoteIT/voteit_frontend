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
      <v-list-item v-for="(props, i) in dialectDefines" :key="i" v-bind="props" />
    </v-list>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import useMeeting from '../useMeeting'
import { translateMeetingRole } from '../utils'

const { t } = useI18n()
const { meetingDialect } = useMeeting()

function * getDialectDefines () {
  const d = meetingDialect.value
  if (!d) return
  if (d.group_roles_active) yield { 'prepend-icon': 'mdi-account-group', title: t('meeting.dialectGroupRoles'), subtitle: d.roles.map(r => r.title).join(', ') }
  if (d.group_votes_active) yield { 'prepend-icon': 'mdi-vote', title: t('meeting.dialectGroupVotes') }
  if (d.block_roles) yield { 'prepend-icon': 'mdi-account-check', title: t('meeting.dialectHandlesMeetingRoles', d.block_roles.length), subtitle: d.block_roles.map(role => translateMeetingRole(role, t)).join(', ') }
}

const dialectDefines = computed(() => [...getDialectDefines()])
</script>
