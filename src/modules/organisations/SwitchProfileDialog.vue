<script setup lang="ts">
import { getFullName } from '@/utils'
import DefaultDialog from '@/components/DefaultDialog.vue'
import UserAvatar from '@/components/UserAvatar.vue'

import useAuthStore from '../auth/useAuthStore'

const authStore = useAuthStore()
</script>

<template>
  <DefaultDialog
    v-if="authStore.user && authStore.alternateUsers.length"
    :title="$t('organization.switchProfile')"
  >
    <template #activator="{ props }">
      <slot name="activator" :props="props"></slot>
    </template>
    <v-alert
      class="my-4"
      icon="mdi-account-switch"
      :title="$t('auth.switchUserTitle')"
      :text="$t('auth.switchUserText')"
    />
    <v-list>
      <v-list-item
        disabled
        append-icon="mdi-check"
        :prepend-avatar="authStore.user.img_url!"
        :subtitle="authStore.user.userid ?? ''"
        :title="getFullName(authStore.user)"
      />
      <v-list-item
        v-for="user in authStore.alternateUsers"
        :key="user.pk"
        @click="authStore.switchUser(user)"
      >
        <template #prepend>
          <UserAvatar :user="user" />
        </template>
        <v-list-item-title :class="{ 'text-secondary': !getFullName(user) }">
          {{ getFullName(user) || `- ${$t('unknownUser')} (${user.pk}) -` }}
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ user.userid }}
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </DefaultDialog>
</template>
