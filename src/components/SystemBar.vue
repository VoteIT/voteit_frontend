<template>
  <v-app-bar app flat v-if="user">
    <v-app-bar-nav-icon v-show="hasNavDrawer" class="d-lg-none" @click.stop="toggleNavDrawerEvent.emit()" />
    <v-app-bar-title>
      <RouterLink to="/" :title="t('home.home')"><img :src="require('@/assets/voteit-logo.svg')" alt="VoteIT" /></RouterLink>
    </v-app-bar-title>
    <div>
      <v-btn append-icon="mdi-chevron-down" class="user-menu" color="surface" :class="{ open: userMenuOpen }" plain @mousedown.stop @click="userMenuOpen = !userMenuOpen">
        <UserAvatar color="background" />
        <span class="ml-2">{{ user.first_name || user.username }}</span>
      </v-btn>
      <v-sheet ref="userMenuComponent" absolute top="59" right="6" rounded min-width="240" elevation="4" v-if="userMenuOpen">
        <div>
          <UserAvatar />
          <h2>{{ user.full_name }}</h2>
          <p>{{ user.username }}</p>
        </div>
        <div>
          <v-btn prepend-icon="mdi-account" plain block disabled>
            {{ t('profile.profile') }}
          </v-btn>
          <v-btn prepend-icon="mdi-at" plain block disabled>
            {{ t('profile.verifyEmail') }}
          </v-btn>
        </div>
        <div>
          <v-btn prepend-icon="mdi-logout" plain block @click="logout()">
            {{ t('auth.logout') }}
          </v-btn>
        </div>
      </v-sheet>
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
import useClickControl from '@/composables/useClickControl'

export default defineComponent({
  inject: ['t'],
  setup () {
    const auth = useAuthentication()
    const router = useRouter()
    const route = useRoute()
    const { t } = useI18n()

    const userMenuOpen = ref(false)
    const userMenuComponent = ref<ComponentPublicInstance | null>(null)

    useClickControl({
      element: userMenuComponent,
      callback: () => {
        userMenuOpen.value = false
      }
    })

    const initials = computed(() => {
      if (auth.user.value) {
        const name = auth.user.value.username
        return name.slice(0, 2).toUpperCase()
      }
      return null
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
      ...auth,
      initials,
      userMenuOpen,
      logout,
      userMenuComponent,
      hasNavDrawer,
      toggleNavDrawerEvent
    }
  }
})
</script>

<style lang="sass">
.v-app-bar
  background-color: rgb(var(--v-theme-app-bar)) !important
  color: rgb(var(--v-theme-on-app-bar))
  overflow: visible !important
  > div
    height: 100%
  .v-app-bar-title
    flex: 1 0 auto
    img
      width: 64px
      height: auto
      margin: 14px 8px 0
  button.user-menu
    i
      transition: transform .2s
      color: rgb(var(--v-theme-surface))
    &.open i
      transform: rotate(180deg)

  .v-sheet
    z-index: 100
    text-align: left
    background-color: rgb(var(--v-theme-surface))
    color: rgb(var(--v-theme-on-surface))
    padding: .3em 0
    border: 1px solid rgb(var(--v-border-color))
    > div
      p
        margin-bottom: 0
      &:first-child
        padding: .7em 1em
      border-bottom: 1px solid rgb(var(--v-border-color))
      &:last-child
        border-bottom: none
    button
      justify-content: left
</style>
