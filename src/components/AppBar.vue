<template>
  <v-app-bar flat class="d-print-none" color="app-bar">
    <v-app-bar-nav-icon
      v-show="hasNavDrawer"
      class="d-md-none"
      variant="text"
      color="background"
      @click.stop="toggleNavDrawerEvent.emit()"
    />
    <router-link to="/" :title="t('home.home')">
      <img src="@/assets/voteit-logo.svg" alt="VoteIT" id="navbar-logo" />
    </router-link>
    <v-app-bar-title>
      {{ title || organisation?.title }}
    </v-app-bar-title>
    <div v-if="user">
      <v-btn
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
    </div>
  </v-app-bar>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { getFullName } from '@/utils'
import { toggleNavDrawerEvent } from '@/utils/events'
import useAuthentication from '@/composables/useAuthentication'
import useOrganisation from '@/modules/organisations/useOrganisation'

import { toggleUserMenu } from './events'

defineProps<{ title?: string }>()

const { t } = useI18n()
const route = useRoute()
const { user } = useAuthentication()
const { organisation } = useOrganisation()

const userMenuOpen = ref(false)

const hasNavDrawer = computed(() => {
  return !!route.matched[0]?.components?.navigationDrawer
})
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
