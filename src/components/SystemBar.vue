<template>
  <v-system-bar v-if="user" height="60">
    <RouterLink to="/" :title="t('home.home')"><img :src="require('@/assets/voteit-logo.svg')" alt="VoteIT" /></RouterLink>
    <div>
      <v-btn class="user-menu" color="surface" :class="{ open: userMenuOpen }" plain @mousedown.stop @click="userMenuOpen = !userMenuOpen">
        <UserAvatar color="background" />
        <span class="ml-2">{{ user.first_name || user.username }}</span>
        <v-icon right icon="mdi-chevron-down" />
      </v-btn>
      <v-sheet ref="userMenuComponent" absolute top="59" right="6" rounded min-width="200" elevation="2" v-if="userMenuOpen">
        <div>
          <UserAvatar />
          <h2>{{ user.full_name }}</h2>
          <p>{{ user.username }}</p>
        </div>
        <div>
          <v-btn plain block disabled>
            <v-icon icon="mdi-account" left />
            {{ t('profile.profile') }}
          </v-btn>
          <v-btn plain block disabled>
            <v-icon icon="mdi-at" left />
            {{ t('profile.verifyEmail') }}
          </v-btn>
        </div>
        <div>
          <v-btn plain block @click="logout()">
            <v-icon icon="mdi-logout" left />
            {{ t('auth.logout') }}
          </v-btn>
        </div>
      </v-sheet>
    </div>
  </v-system-bar>
</template>

<script lang="ts">
import { ComponentPublicInstance, computed, defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'

import useAuthentication from '@/composables/useAuthentication'
import useClickControl from '@/composables/useClickControl'

export default defineComponent({
  inject: ['t'],
  setup () {
    const auth = useAuthentication()
    const router = useRouter()
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

    return {
      ...auth,
      initials,
      userMenuOpen,
      logout,
      userMenuComponent
    }
  }
})
</script>

<style lang="sass">
.v-system-bar
  background-color: rgb(var(--v-theme-app-bar)) !important
  justify-content: space-between !important
  img
    width: 70px
    height: auto
    margin: 8px 8px 0
  button.user-menu
    i
      transition: transform .2s
      color: rgb(var(--v-theme-surface))
    &.open i
      transform: rotate(180deg)

  .v-sheet
    z-index: 100
    background-color: rgb(var(--v-theme-surface))
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
