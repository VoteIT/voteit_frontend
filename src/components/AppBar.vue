<template>
  <v-app-bar app flat v-if="user">
    <v-app-bar-nav-icon v-show="hasNavDrawer" class="d-lg-none" @click.stop="toggleNavDrawerEvent.emit()" />
    <v-app-bar-title>
      <RouterLink to="/" :title="t('home.home')"><img :src="require('@/assets/voteit-logo.svg').default" alt="VoteIT" /></RouterLink>
    </v-app-bar-title>
    <v-spacer />
    <div>
      <v-btn class="user-menu" :class="{ open: userMenuOpen }" variant="text" @click="userMenuOpen = !userMenuOpen">
        <UserAvatar color="background" />
        <span class="ml-2">{{ user.full_name || user.username }}</span>
      </v-btn>
      <teleport to="main.v-main">
        <v-navigation-drawer position="right" v-model="userMenuOpen" disable-resize-watcher temporary>
          <v-list nav density="comfortable">
            <v-list-item>
              <UserAvatar size="large" />
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="text-h6">{{ user.full_name }}</v-list-item-title>
                <v-list-item-subtitle>{{ user.userid }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-divider class="mb-2 mt-2" />
            <v-list-item :href="idHost" prepend-icon="mdi-account" disabled>
              {{ t('profile.profile') }}
            </v-list-item>
          </v-list>
          <template v-slot:append>
            <v-list nav density="comfortable">
              <v-list-item prepend-icon="mdi-account" :href="idHost" :title="t('auth.manageAccount')" />
              <v-list-item prepend-icon="mdi-logout" @click="logout()" :title="t('auth.logout')" />
            </v-list>
          </template>
        </v-navigation-drawer>
      </teleport>
    </div>
  </v-app-bar>
</template>

<script lang="ts">
import { ComponentPublicInstance, computed, defineComponent, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { dialogQuery, toggleNavDrawerEvent } from '@/utils'
import { ThemeColor } from '@/utils/types'

import useAuthentication from '@/composables/useAuthentication'

export default defineComponent({
  setup () {
    const auth = useAuthentication()
    const router = useRouter()
    const route = useRoute()
    const { t } = useI18n()

    const userMenuOpen = ref(false)
    const userMenuComponent = ref<ComponentPublicInstance | null>(null)

    async function logout () {
      userMenuOpen.value = false
      if (!await dialogQuery({
        title: t('auth.logoutPrompt'),
        theme: ThemeColor.Warning
      })) return
      auth.logout()
      router.push('/')
    }

    const hasNavDrawer = computed(() => {
      return !!route.matched[0]?.components?.navigationDrawer
    })

    return {
      t,
      ...auth,
      userMenuOpen,
      logout,
      userMenuComponent,
      hasNavDrawer,
      toggleNavDrawerEvent,
      idHost: process.env.VUE_APP_ID_HOST
    }
  }
})
</script>

<style lang="sass">
.v-app-bar
  background-color: rgb(var(--v-theme-app-bar)) !important
  color: rgb(var(--v-theme-on-app-bar))
  .v-app-bar-title
    img
      width: 64px
      height: auto
      margin: 14px 8px 0
  button.user-menu
    color: rgb(var(--v-theme-on-app-bar))

#app-bar-user-menu
  z-index: 4
  .v-icon
    font-size: 16pt
</style>
