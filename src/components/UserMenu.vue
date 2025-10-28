<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { getFullName } from '@/utils'
import { languages, currentLocale } from '@/utils/locales'
import useOrganisation from '@/modules/organisations/useOrganisation'
import { IUser } from '@/modules/organisations/types'
import { profileType } from '@/modules/organisations/contentTypes'

import DefaultDialog from './DefaultDialog.vue'
import { toggleUserMenu } from './events'
import UserAvatar from './UserAvatar.vue'
import DefaultForm from './DefaultForm.vue'
import useRules from '@/composables/useRules'
import SlugField from './inputs/SlugField.vue'
import useAuthStore from '@/modules/auth/useAuthStore'

const { t } = useI18n()
const router = useRouter()
const rules = useRules(t)

const authStore = useAuthStore()
const { manageAccountURL, proxyLogoutURL } = useOrganisation()

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
  if (proxyLogoutURL.value) location.assign(proxyLogoutURL.value)
  else router.push({ name: 'home' })
}

function updateProfile(data: IUser) {
  return authStore.updateProfile(data)
}

const emailChoices = shallowRef<string[] | null>(null)
const emailError = shallowRef(false)
async function fetchEmailChoices() {
  if (emailChoices.value) return
  emailError.value = false
  try {
    const { data } = await profileType.api.listAction<{ emails: string[] }>(
      'email_choices',
      undefined,
      'get'
    )
    emailChoices.value = data.emails
  } catch {
    emailError.value = true
  }
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
      <DefaultDialog
        :title="$t('profile.changeUserid')"
        @open="fetchEmailChoices"
      >
        <template #activator="{ props }">
          <v-list-item
            prepend-icon="mdi-account"
            :title="$t('profile.profile')"
            v-bind="props"
          />
        </template>
        <template v-slot="{ close }">
          <v-alert
            :text="$t('profile.editProfileHelp')"
            type="info"
            class="my-4"
          />
          <v-defaults-provider :defaults="{ VList: { bgColor: 'surface' } }">
            <DefaultForm
              :modelValue="authStore.user"
              :handler="updateProfile"
              @done="close"
              v-slot="{ errors, formData }"
            >
              <v-text-field
                :error-messages="errors.first_name"
                :label="$t('profile.firstName')"
                :rules="[rules.required]"
                v-model="formData.first_name"
              />
              <v-text-field
                :error-messages="errors.last_name"
                :label="$t('profile.lastName')"
                :rules="[rules.required]"
                v-model="formData.last_name"
              />
              <v-select
                v-if="emailChoices"
                :error-messages="errors.email"
                :items="emailChoices"
                :label="$t('profile.email')"
                v-model="formData.email"
              />
              <v-alert
                v-else-if="emailError"
                class="mb-5"
                icon="mdi-email-off"
                :text="$t('profile.emailFetchFailed')"
              />
              <v-progress-linear
                v-else
                class="my-4"
                indeterminate
                color="primary"
              />
              <SlugField
                :error-messages="errors.userid"
                :label="$t('profile.userId')"
                :rules="[rules.required]"
                v-model="formData.userid!"
              />
            </DefaultForm>
          </v-defaults-provider>
        </template>
      </DefaultDialog>
      <DefaultDialog v-if="canSwitchUser" :title="$t('profile.switchUser')">
        <template #activator="{ props }">
          <v-list-item
            prepend-icon="mdi-account-switch"
            :title="$t('profile.switchUser')"
            v-bind="props"
          />
        </template>
        <v-list>
          <v-list-item
            v-for="user in authStore.alternateUsers"
            :key="user.pk"
            @click="authStore.switchUser(user)"
          >
            <template #prepend>
              <UserAvatar :user="user" />
            </template>
            <v-list-item-title
              :class="{ 'text-secondary': !getFullName(user) }"
            >
              {{ getFullName(user) || `- ${t('unknownUser')} (${user.pk}) -` }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ user.userid }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </DefaultDialog>
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
          :href="manageAccountURL"
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
