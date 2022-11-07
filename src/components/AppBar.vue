<template>
  <v-app-bar app flat class="d-print-none" color="app-bar">
    <v-app-bar-nav-icon v-show="hasNavDrawer" class="d-md-none" variant="text" color="background" @click.stop="toggleNavDrawerEvent.emit()" />
    <router-link to="/" :title="t('home.home')">
      <img :src="require('@/assets/voteit-logo.svg')" alt="VoteIT" id="navbar-logo" />
    </router-link>
    <v-spacer />
    <div v-if="user">
      <v-btn class="user-menu" :class="{ open: userMenuOpen }" variant="text" @click="userMenuOpen = !userMenuOpen">
        <UserAvatar color="background" />
        <span class="ml-2">{{ user.full_name || user.userid }}</span>
      </v-btn>
      <teleport to="main.v-main">
        <v-navigation-drawer location="right" v-model="userMenuOpen" disable-resize-watcher temporary>
          <v-list nav density="comfortable">
            <v-list-item class="no-prepend">
              <UserAvatar size="large" class="my-2" />
              <v-list-item-title class="text-h6">{{ user.full_name }}</v-list-item-title>
              <v-list-item-subtitle>{{ user.userid }}</v-list-item-subtitle>
            </v-list-item>
            <v-divider class="my-3" />
            <DefaultDialog :title="t('profile.changeUserid')">
              <template #activator="{ props }">
                <v-list-item prepend-icon="mdi-account" :title="t('profile.profile')" v-bind="props" />
              </template>
              <template v-slot="{ close }">
                <v-alert :text="t('profile.editProfileHelp')" type="info" class="my-4" />
                <v-defaults-provider :defaults="{ 'VList': { bgColor: 'surface' } }">
                  <SchemaForm v-if="profileSchema" :schema="profileSchema" :modelValue="user" :handler="updateProfile" @saved="close">
                    <template #buttons="{ disabled, submitting }">
                      <div class="text-right">
                        <v-btn variant="text" @click="close">
                          {{ t('cancel') }}
                        </v-btn>
                        <v-btn color="primary" variant="elevated" type="submit" :loading="submitting" :disabled="disabled">
                          {{ t('save') }}
                        </v-btn>
                      </div>
                    </template>
                  </SchemaForm>
                  <div v-else class="text-center">
                    <v-progress-circular indeterminate color="primary" />
                  </div>
                </v-defaults-provider>
              </template>
            </DefaultDialog>
            <DefaultDialog v-if="canSwitchUser" :title="t('profile.switchUser')">
              <template #activator="{ props }">
                <v-list-item prepend-icon="mdi-account-switch" :title="t('profile.switchUser')" v-bind="props" />
              </template>
              <v-list>
                <v-list-item
                  v-for="user in alternateUsers"
                  :key="user.pk"
                  @click="auth.switchUser(user)"
                >
                  <template #prepend>
                    <UserAvatar :user="user" />
                  </template>
                  <v-list-item-title :class="{ 'text-secondary': !user.full_name }">
                    {{ user.full_name ?? `- ${t('unknownUser')} (${user.pk}) -` }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ user.userid }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </DefaultDialog>
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

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { toggleNavDrawerEvent } from '@/utils/events'
import * as rules from '@/utils/rules'
import useAlert from '@/composables/useAlert'
import useAuthentication from '@/composables/useAuthentication'

import { profileType } from '@/modules/organisations/contentTypes'
import useOrganisation from '@/modules/organisations/useOrganisation'
import { User } from '@/modules/organisations/types'

import DefaultDialog from './DefaultDialog.vue'
import SchemaForm from './SchemaForm.vue'
import { FieldType } from './types'
import type { FormSchema } from './types'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthentication()
const { user, alternateUsers } = auth // For template
const { manageAccountURL, proxyLogoutURL } = useOrganisation()
const { alert } = useAlert()

const userMenuOpen = ref(false)

async function logout () {
  userMenuOpen.value = false
  await auth.logout()
  if (proxyLogoutURL.value) location.assign(proxyLogoutURL.value)
  else router.push({ name: 'home' })
}

const hasNavDrawer = computed(() => {
  return !!route.matched[0]?.components?.navigationDrawer
})

function updateProfile (data: Pick<User, 'userid' | 'first_name' | 'last_name' | 'email'>) {
  return auth.updateProfile(data)
}

const emailChoices = ref<string[] | null>(null)
async function fetchEmailChoices () {
  try {
    const { data } = await profileType.api.getAction<{ emails: string[] }>('email_choices')
    emailChoices.value = data.emails
  } catch {
    alert('^Could not load email address options')
  }
}

const profileSchema = computed<FormSchema | undefined>(() => {
  if (!emailChoices.value) {
    fetchEmailChoices()
    return
  }
  return [
    {
      name: 'first_name',
      label: 'Förnamn',
      type: FieldType.Text,
      rules: [rules.required]
    },
    {
      name: 'last_name',
      label: 'Efternamn',
      type: FieldType.Text,
      rules: [rules.required]
    },
    {
      name: 'email',
      label: 'E-post',
      type: FieldType.Select,
      rules: [rules.required],
      items: emailChoices.value.map(v => ({ value: v, title: v }))
    },
    {
      name: 'userid',
      label: 'Användar-ID',
      type: FieldType.Text,
      rules: [rules.slug, rules.required]
    }
  ]
})

const canSwitchUser = computed(() => {
  return !!auth.alternateUsers.value.length
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
