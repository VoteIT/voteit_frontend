<script setup lang="ts">
import { useRoute } from 'vue-router'

import { cols } from '@/utils/defaults'
import AppBar from '@/components/AppBar.vue'
import useOrgStore from '@/modules/organisations/useOrgStore'

import LoginButton from './LoginButton.vue'

/**
 * Shown by the app in place of a view that needs a session, while the address
 * stays the one the visitor asked for. See `needsLogin`.
 */

const route = useRoute()
const orgStore = useOrgStore()
</script>

<template>
  <AppBar />
  <v-main>
    <v-container>
      <v-row class="my-6">
        <v-col v-bind="cols.default" class="text-center">
          <h1 class="mb-6">{{ $t('permission.defaultLoginMessage') }}</h1>
          <div class="d-flex flex-column ga-3 mx-auto login">
            <LoginButton block :next="route.fullPath" />
            <v-alert
              v-if="!orgStore.canLogin"
              :text="$t('organization.cantLogin')"
              type="error"
            />
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<style scoped lang="sass">
.login
  max-width: 400px
</style>
