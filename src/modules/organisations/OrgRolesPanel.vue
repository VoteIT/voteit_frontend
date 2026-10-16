<script lang="ts" setup>
import { computed, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogAlert, dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'
import RoleMatrix from '@/components/RoleMatrix.vue'
import UserSearch from '@/components/UserSearch.vue'
import useErrorHandler from '@/composables/useErrorHandler'

import useAuthStore from '../auth/useAuthStore'

import { organisationType } from './contentTypes'
import { OrganisationRole } from './types'
import useOrgStore from './useOrgStore'

const organisationIcons: Record<OrganisationRole, string> = {
  meeting_creator: 'mdi-calendar-plus',
  org_manager: 'mdi-account-supervisor-circle'
}

const { t } = useI18n()
const authStore = useAuthStore()
const { handled } = useErrorHandler({ target: 'dialog' })
const orgStore = useOrgStore()

const selectedRole = shallowRef(OrganisationRole.MeetingCreator)
const roleItems = computed(() =>
  Object.values(OrganisationRole).map((value) => ({
    value,
    title: organisationType.getRole(value).translateName(t),
    props: { prependIcon: organisationIcons[value] }
  }))
)

async function addRole(user: number) {
  if (!orgStore.organisation) throw new Error('No organisation')
  const { pk } = orgStore.organisation
  await handled(
    () => organisationType.addRoles(pk, user, selectedRole.value),
    'roles'
  )
}

async function removeConfirm(user: number, role?: OrganisationRole) {
  if (user === authStore.user?.pk) {
    if (!role) {
      dialogAlert(t('organization.cantRemoveSelf'), ThemeColor.Warning)
      return false
    }
    if (role === OrganisationRole.Manager) {
      dialogAlert(t('organization.cantRemoveSelfManager'), ThemeColor.Warning)
      return false
    }
  }
  if (role) return true
  return dialogQuery({ title: t('areYouSure'), theme: ThemeColor.Warning })
}
</script>

<template>
  <div v-if="orgStore.organisation">
    <RoleMatrix
      admin
      class="mb-4"
      :contentType="organisationType"
      :pk="orgStore.organisation.pk"
      :icons="organisationIcons"
      :remove-confirm="removeConfirm"
    />
    <div class="d-flex flex-wrap ga-2">
      <v-select
        v-model="selectedRole"
        class="role-select flex-grow-0"
        hide-details
        :items="roleItems"
        :label="$t('role.add')"
        :prepend-inner-icon="organisationIcons[selectedRole]"
      />
      <UserSearch class="flex-grow-1" @submit="addRole" />
    </div>
  </div>
</template>

<style lang="sass" scoped>
.role-select
  min-width: 200px
</style>
