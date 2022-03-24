<template>
  <v-app-bar app flat>
    <v-app-bar-nav-icon v-show="hasNavDrawer" class="d-md-none" variant="text" color="background" @click.stop="toggleNavDrawerEvent.emit()" />
    <v-app-bar-title>
      <RouterLink to="/" :title="t('home.home')"><img :src="require('@/assets/voteit-logo.svg').default" alt="VoteIT" /></RouterLink>
    </v-app-bar-title>
    <v-spacer />
    <div v-if="user">
      <v-btn class="user-menu" :class="{ open: userMenuOpen }" variant="text" @click="userMenuOpen = !userMenuOpen">
        <UserAvatar color="background" />
        <span class="ml-2">{{ user.full_name || user.username }}</span>
      </v-btn>
      <teleport to="main.v-main">
        <v-navigation-drawer position="right" v-model="userMenuOpen" disable-resize-watcher temporary>
          <v-list nav density="comfortable">
            <v-list-item class="no-prepend">
              <UserAvatar size="large" />
            </v-list-item>
            <v-list-item class="no-prepend">
              <div>
                <v-list-item-title class="text-h6">{{ user.full_name }}</v-list-item-title>
                <v-list-item-subtitle>{{ user.userid }}</v-list-item-subtitle>
              </div>
            </v-list-item>
            <v-divider class="mb-2 mt-2" />
            <v-dialog>
              <template #activator="{ props }">
                <v-list-item prepend-icon="mdi-account" :title="t('profile.profile')" v-bind="props" />
              </template>
              <template #default="{ isActive }">
                <v-sheet class="pa-4" v-bind="dialogDefaults">
                  <h2 class="mb-2">
                    {{ t('profile.changeUserid') }}
                  </h2>
                  <v-alert :text="t('profile.editProfileHelp')" type="info" class="my-4" />
                  <SchemaForm :schema="profileSchema" :modelValue="user" :handler="updateProfile" @saved="isActive.value = false">
                    <template #buttons="{ valid, disabled }">
                      <div class="text-right">
                        <v-btn variant="text" @click="isActive.value = false">
                          {{ t('cancel') }}
                        </v-btn>
                        <v-btn color="primary" type="submit" :disabled="disabled || !valid">
                          {{ t('save') }}
                        </v-btn>
                      </div>
                    </template>
                  </SchemaForm>
                </v-sheet>
              </template>
            </v-dialog>
          </v-list>
          <template v-slot:append>
            <v-list nav density="comfortable">
              <v-list-item prepend-icon="mdi-account" :href="manageAccountURL" :title="t('auth.manageAccount')" />
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

import { dialogQuery } from '@/utils'
import { toggleNavDrawerEvent } from '@/utils/events'
import { ThemeColor } from '@/utils/types'

import useAuthentication from '@/composables/useAuthentication'
import useDefaults from '@/composables/useDefaults'
import useOrganisation from '@/modules/organisations/useOrganisation'
import SchemaForm from './SchemaForm.vue'
import { User } from '@/modules/organisations/types'
import { FieldType, FormSchema } from './types'

import * as rules from '@/utils/rules'

export default defineComponent({
  components: { SchemaForm },
  setup () {
    const { t } = useI18n()
    const router = useRouter()
    const route = useRoute()
    const auth = useAuthentication()
    const { manageAccountURL } = useOrganisation()

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

    async function updateProfile (data: Pick<User, 'userid'>) {
      await auth.updateProfile(data)
    }

    const profileSchema = computed<FormSchema>(() => {
      return [
        {
          name: 'first_name',
          label: 'Förnamn',
          type: FieldType.Text,
          rules: [rules.disabled]
        },
        {
          name: 'last_name',
          label: 'Efternamn',
          type: FieldType.Text,
          rules: [rules.disabled]
        },
        {
          name: 'userid',
          label: 'Användar-ID',
          type: FieldType.Text,
          rules: [rules.slug, rules.required]
        }
      ]
    })

    return {
      t,
      ...auth,
      ...useDefaults(),
      hasNavDrawer,
      manageAccountURL,
      profileSchema,
      toggleNavDrawerEvent,
      userMenuComponent,
      userMenuOpen,
      logout,
      updateProfile
    }
  }
})
</script>

<style lang="sass">
.v-toolbar
  background-color: rgb(var(--v-theme-app-bar)) !important
  color: rgb(var(--v-theme-on-app-bar))
  .v-toolbar-title
    img
      width: 64px
      height: auto
      margin: 14px 8px 0
  button.user-menu
    color: rgb(var(--v-theme-on-app-bar))

.v-list--density-comfortable .v-list-item--prepend.no-prepend
  -webkit-padding-start: 16px !important
  padding-inline-start: 16px !important
</style>
