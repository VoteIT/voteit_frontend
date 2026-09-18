<script setup lang="ts">
import { onBeforeMount, shallowRef } from 'vue'

import { openAlertEvent } from '@/utils/events'
import { parseRestError } from '@/utils/restApi'
import Moment from '@/components/Moment.vue'
import QueryDialog from '@/components/QueryDialog.vue'
import useOrgStore from '@/modules/organisations/useOrgStore'
import { LoginProvider } from '@/modules/organisations/types'

import useLoginMethods, { UserConnection } from './useLoginMethods'

const orgStore = useOrgStore()

const {
  connectableProviders,
  connections,
  connect,
  disconnect,
  fetchConnections
} = useLoginMethods()

const failed = shallowRef(false)
const working = shallowRef<string>()

async function load() {
  failed.value = false
  try {
    await fetchConnections(true)
  } catch {
    failed.value = true
  }
}

async function startConnect(provider: LoginProvider) {
  working.value = provider.provider_id
  try {
    await connect(provider)
  } catch (e) {
    working.value = undefined
    openAlertEvent.emit(
      `^${Object.values(parseRestError(e)).flat().join(', ')}`
    )
  }
}

/** The provider's own account page, for the ones that have one. */
function profileURL(connection: UserConnection) {
  return (
    orgStore.providers.find((p) => p.provider_id === connection.provider)
      ?.profile_url ?? undefined
  )
}

async function removeConnection(connection: UserConnection) {
  working.value = connection.provider
  try {
    await disconnect(connection)
  } catch (e) {
    openAlertEvent.emit(
      `^${Object.values(parseRestError(e)).flat().join(', ')}`
    )
  }
  working.value = undefined
}

onBeforeMount(load)
</script>

<template>
  <v-sheet border class="pa-4" rounded>
    <h2 class="mb-1">{{ $t('auth.loginMethods.title') }}</h2>
    <p class="text-medium-emphasis mb-4">
      {{ $t('auth.loginMethods.description') }}
    </p>
    <v-alert
      v-if="failed"
      icon="mdi-alert"
      :text="$t('auth.loginMethods.fetchFailed')"
      type="warning"
    />
    <v-progress-linear v-else-if="!connections" color="primary" indeterminate />
    <template v-else>
      <v-list bg-color="transparent" class="pa-0">
        <v-list-item
          v-for="connection in connections"
          :key="connection.pk"
          class="px-0"
          :title="connection.title"
        >
          <template #subtitle>
            {{ $t('auth.loginMethods.connected') }}
            <Moment :date="connection.created" ordinary />
          </template>
          <template #append>
            <v-btn
              v-if="profileURL(connection)"
              :aria-label="$t('auth.manageAccount')"
              :href="profileURL(connection)"
              icon="mdi-open-in-new"
              rel="noopener"
              size="small"
              target="_blank"
              variant="text"
            />
            <QueryDialog
              color="warning"
              :confirm-text="$t('auth.loginMethods.disconnect')"
              :text="
                connection.is_only_login_method
                  ? $t('auth.loginMethods.confirmDisconnectLast', {
                      title: connection.title
                    })
                  : $t('auth.loginMethods.confirmDisconnect', {
                      title: connection.title
                    })
              "
              @confirmed="removeConnection(connection)"
            >
              <template #activator="{ props }">
                <v-btn
                  :aria-label="$t('auth.loginMethods.disconnect')"
                  icon="mdi-link-variant-off"
                  :loading="working === connection.provider"
                  size="small"
                  variant="text"
                  v-bind="props"
                />
              </template>
            </QueryDialog>
          </template>
        </v-list-item>
      </v-list>
      <v-alert
        v-if="!connections.length"
        class="mb-4"
        icon="mdi-link-variant-off"
        :text="$t('auth.loginMethods.none')"
        type="warning"
      />
      <template v-if="connectableProviders.length">
        <v-divider class="my-4" />
        <p class="mb-3">{{ $t('auth.loginMethods.addHelp') }}</p>
        <div class="d-flex flex-wrap ga-2">
          <v-btn
            v-for="provider in connectableProviders"
            :key="provider.provider_id"
            :loading="working === provider.provider_id"
            prepend-icon="mdi-link-variant-plus"
            :text="$t('auth.loginMethods.add', { title: provider.title })"
            variant="tonal"
            @click="startConnect(provider)"
          />
        </div>
      </template>
    </template>
  </v-sheet>
</template>
