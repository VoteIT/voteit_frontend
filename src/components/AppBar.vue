<template>
  <v-app-bar
    flat
    class="d-print-none"
    color="app-bar"
    :title="title || organisation?.title"
  >
    <template #prepend>
      <v-app-bar-nav-icon
        v-if="hasNavDrawer"
        class="d-md-none"
        color="background"
        variant="text"
        @click.stop="toggleNavDrawerEvent.emit()"
      />
      <router-link to="/" :title="$t('home.home')">
        <img src="@/assets/voteit-logo.svg" alt="VoteIT" id="navbar-logo" />
      </router-link>
    </template>
    <v-btn
      v-if="user"
      class="user-menu"
      :class="{ open: userMenuOpen }"
      variant="text"
      @click="toggleUserMenu.emit()"
    >
      <UserAvatar color="background" />
      <span class="ml-2 d-none d-sm-inline">{{
        getFullName(user) || user.userid
      }}</span>
    </v-btn>
  </v-app-bar>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

import { getFullName } from '@/utils'
import { toggleNavDrawerEvent } from '@/utils/events'
import useAuthStore from '@/modules/auth/useAuthStore'
import useOrgStore from '@/modules/organisations/useOrgStore'

import { toggleUserMenu } from './events'
import UserAvatar from './UserAvatar.vue'

defineProps<{ hasNavDrawer?: boolean; title?: string }>()

const { user } = storeToRefs(useAuthStore())
const { organisation } = storeToRefs(useOrgStore())

const userMenuOpen = ref(false)
</script>

<style lang="sass">
#navbar-logo
  width: 64px
  height: auto
  margin: 10px 16px 0

.v-list--density-comfortable .v-list-item--prepend.no-prepend
  -webkit-padding-start: 16px !important
  padding-inline-start: 16px !important
</style>
