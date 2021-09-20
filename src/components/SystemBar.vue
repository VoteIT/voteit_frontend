<template>
  <v-app-bar app flat v-if="user">
    <v-app-bar-nav-icon v-show="hasNavDrawer" class="d-lg-none" @click.stop="toggleNavDrawerEvent.emit()" />
    <v-app-bar-title>
      <RouterLink to="/" :title="t('home.home')"><img :src="require('@/assets/voteit-logo.svg').default" alt="VoteIT" /></RouterLink>
    </v-app-bar-title>
    <div>
      <v-btn append-icon="mdi-chevron-down" class="user-menu" :class="{ open: userMenuOpen }" variant="text" @mousedown.stop @click="userMenuOpen = !userMenuOpen">
        <UserAvatar color="background" />
        <span class="ml-2">{{ user.first_name || user.username }}</span>
      </v-btn>
      <teleport to="body">
        <v-sheet id="app-bar-user-menu" ref="userMenuComponent" fixed top="60" right="4" rounded min-width="240" elevation="4" v-if="userMenuOpen">
          <v-list nav density="comfortable">
            <v-list-item>
              <UserAvatar />
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="text-h6">{{ user.full_name }}</v-list-item-title>
                <v-list-item-subtitle>{{ user.username }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-divider />
            <v-list-item :href="idHost" prepend-icon="mdi-account">
              {{ t('profile.profile') }}
            </v-list-item>
            <v-list-item prepend-icon="mdi-logout" @click="logout()">
              {{ t('auth.logout') }}
            </v-list-item>
          </v-list>
        </v-sheet>
      </teleport>
    </div>
  </v-app-bar>
</template>

<script lang="ts">
import { ComponentPublicInstance, computed, defineComponent, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { onClickOutside } from '@vueuse/core'

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

    onClickOutside(userMenuComponent, () => {
      userMenuOpen.value = false
    })

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
  > div
    height: 100%
  .v-app-bar-title
    flex: 1 0 auto
    img
      width: 64px
      height: auto
      margin: 14px 8px 0
  button.user-menu
    color: rgb(var(--v-theme-on-app-bar))
    i
      transition: transform .2s
    &.open i
      transform: rotate(180deg)

#app-bar-user-menu
  z-index: 4
  .v-icon
    font-size: 16pt
</style>
