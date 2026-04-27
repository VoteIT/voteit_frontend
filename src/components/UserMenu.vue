<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { getFullName } from '@/utils'
import { languages, currentLocale } from '@/utils/locales'
import useOrgStore from '@/modules/organisations/useOrgStore'

import DefaultDialog from './DefaultDialog.vue'
import { toggleUserMenu } from './events'
import UserAvatar from './UserAvatar.vue'
import useAuthStore from '@/modules/auth/useAuthStore'
import SwitchProfileDialog from '@/modules/organisations/SwitchProfileDialog.vue'

const { t } = useI18n()
const router = useRouter()

const authStore = useAuthStore()
const orgStore = useOrgStore()

const userMenuOpen = ref(false)
toggleUserMenu.on(() => {
  userMenuOpen.value = !userMenuOpen.value
})

function setCurrentLocale(locale: string, close: () => void) {
  currentLocale.value = locale
  close()
}

async function logout() {
  userMenuOpen.value = false
  await authStore.logout()
  if (orgStore.proxyLogoutURL) location.assign(orgStore.proxyLogoutURL)
  else router.push({ name: 'home' })
}

const canSwitchUser = computed(() => {
  return !!authStore.alternateUsers.length
})
</script>

<template>
  <v-navigation-drawer
    v-if="authStore.user"
    location="right"
    v-model="userMenuOpen"
    disable-resize-watcher
    temporary
  >
    <v-list nav density="comfortable">
      <v-list-item class="no-prepend">
        <UserAvatar size="large" class="my-2" />
        <v-list-item-title class="text-h6 pb-1">{{
          getFullName(authStore.user)
        }}</v-list-item-title>
        <v-list-item-subtitle>{{ authStore.user.userid }}</v-list-item-subtitle>
      </v-list-item>
      <v-divider v-if="$slots.prependProfile" class="my-3" />
      <slot name="prependProfile"></slot>
      <v-divider class="my-3" />
      <v-list-item
        prepend-icon="mdi-account"
        :title="$t('profile.profile')"
        :to="{ name: 'profile' }"
      />
      <SwitchProfileDialog>
        <template #activator="{ props }">
          <v-list-item
            prepend-icon="mdi-account-switch"
            :title="$t('organization.switchProfile')"
            v-bind="props"
          />
        </template>
      </SwitchProfileDialog>
      <DefaultDialog :title="$t('language.choose')">
        <template #activator="{ props }">
          <v-list-item
            prepend-icon="mdi-translate"
            :title="$t('language.choose')"
            v-bind="props"
          />
        </template>
        <template #default="{ close }">
          <p class="my-2">
            {{ $t('language.disclaimer') }}
          </p>
          <v-list class="my-4" color="primary">
            <v-list-item
              v-for="locale in languages"
              :key="locale"
              :active="locale === currentLocale"
              :disabled="locale === currentLocale"
              :title="
                new Intl.DisplayNames([locale], { type: 'language' }).of(locale)
              "
              @click="setCurrentLocale(locale, close)"
            />
          </v-list>
          <div class="text-right">
            <v-btn :text="$t('cancel')" variant="text" @click="close" />
          </div>
        </template>
      </DefaultDialog>
    </v-list>
    <template #append>
      <v-list nav density="comfortable">
        <v-list-item
          prepend-icon="mdi-account"
          :href="orgStore.manageAccountURL"
          :title="$t('auth.manageAccount')"
        />
        <v-list-item
          prepend-icon="mdi-logout"
          @click="logout"
          :title="$t('auth.logout')"
        />
      </v-list>
    </template>
  </v-navigation-drawer>
</template>
