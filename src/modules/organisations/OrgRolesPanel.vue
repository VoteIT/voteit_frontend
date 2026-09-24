<script lang="ts" setup>
import RoleMatrix from '@/components/RoleMatrix.vue'
import UserSearch from '@/components/UserSearch.vue'
import useErrorHandler from '@/composables/useErrorHandler'

import { organisationType } from './contentTypes'
import { OrganisationRole } from './types'
import useOrgStore from './useOrgStore'

const organisationIcons: Record<OrganisationRole, string> = {
  meeting_creator: 'mdi-calendar-plus',
  org_manager: 'mdi-account-supervisor-circle'
}

const { handled } = useErrorHandler({ target: 'dialog' })
const orgStore = useOrgStore()

async function addUser(user: number) {
  if (!orgStore.organisation) throw new Error('No organisation')
  const { pk } = orgStore.organisation
  await handled(
    () => organisationType.addRoles(pk, user, OrganisationRole.MeetingCreator),
    'roles'
  )
}
</script>

<template>
  <div v-if="orgStore.organisation">
    <UserSearch class="mb-6" @submit="addUser" />
    <RoleMatrix
      admin
      :contentType="organisationType"
      :pk="orgStore.organisation.pk"
      :icons="organisationIcons"
      :remove-confirm-text="$t('areYouSure')"
    />
  </div>
</template>
