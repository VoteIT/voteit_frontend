<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { getFullName } from '@/utils'
import { languages, currentLocale } from '@/utils/locales'
import * as rules from '@/utils/rules'
import useAlert from '@/composables/useAlert'
import useAuthentication from '@/composables/useAuthentication'
import useOrganisation from '@/modules/organisations/useOrganisation'
import { IUser } from '@/modules/organisations/types'
import { profileType } from '@/modules/organisations/contentTypes'

import DefaultDialog from './DefaultDialog.vue'
import SchemaForm from './SchemaForm.vue'
import { FieldType } from './types'
import type { FormSchema } from './types'
import { toggleUserMenu } from './events'
import UserAvatar from './UserAvatar.vue'

const { t } = useI18n()
const router = useRouter()

const { alert } = useAlert()
const { alternateUsers, user, ...auth } = useAuthentication()
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
  await auth.logout()
  if (proxyLogoutURL.value) location.assign(proxyLogoutURL.value)
  else router.push({ name: 'home' })
}

function updateProfile(data: IUser) {
  return auth.updateProfile(data)
}

const emailChoices = ref<string[] | null>(null)
async function fetchEmailChoices() {
  try {
    const { data } = await profileType.api.getAction<{ emails: string[] }>(
      'email_choices'
    )
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
      items: emailChoices.value.map((v) => ({ value: v, title: v }))
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
  return !!alternateUsers.value.length
})
</script>

<template>
  <v-navigation-drawer
    v-if="user"
    location="right"
    v-model="userMenuOpen"
    disable-resize-watcher
    temporary
  >
    <v-list nav density="comfortable">
      <v-list-item class="no-prepend">
        <UserAvatar size="large" class="my-2" />
        <v-list-item-title class="text-h6">{{
          getFullName(user)
        }}</v-list-item-title>
        <v-list-item-subtitle>{{ user.userid }}</v-list-item-subtitle>
      </v-list-item>
      <v-divider v-if="$slots.prependProfile" class="my-3" />
      <slot name="prependProfile"></slot>
      <v-divider class="my-3" />
      <DefaultDialog :title="t('profile.changeUserid')">
        <template #activator="{ props }">
          <v-list-item
            prepend-icon="mdi-account"
            :title="t('profile.profile')"
            v-bind="props"
          />
        </template>
        <template v-slot="{ close }">
          <v-alert
            :text="t('profile.editProfileHelp')"
            type="info"
            class="my-4"
          />
          <v-defaults-provider :defaults="{ VList: { bgColor: 'surface' } }">
            <SchemaForm
              v-if="profileSchema"
              :schema="profileSchema"
              :modelValue="user"
              :handler="updateProfile"
              @saved="close"
            >
              <template #buttons="{ disabled, submitting }">
                <div class="text-right">
                  <v-btn variant="text" @click="close">
                    {{ t('cancel') }}
                  </v-btn>
                  <v-btn
                    color="primary"
                    variant="elevated"
                    type="submit"
                    :loading="submitting"
                    :disabled="disabled"
                  >
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
          <v-list-item
            prepend-icon="mdi-account-switch"
            :title="t('profile.switchUser')"
            v-bind="props"
          />
        </template>
        <v-list>
          <v-list-item
            v-for="user in alternateUsers"
            :key="user.pk"
            @click="auth.switchUser(user)"
          >
            <template #prepend>
              <UserAvatar :user="(user as IUser)" />
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
      <DefaultDialog :title="t('language.choose')">
        <template #activator="{ props }">
          <v-list-item
            prepend-icon="mdi-translate"
            :title="t('language.choose')"
            v-bind="props"
          />
        </template>
        <template #default="{ close }">
          <p class="my-2">
            {{ t('language.disclaimer') }}
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
            <v-btn @click="close" variant="text">
              {{ t('cancel') }}
            </v-btn>
          </div>
        </template>
      </DefaultDialog>
    </v-list>
    <template #append>
      <v-list nav density="comfortable">
        <v-list-item
          prepend-icon="mdi-account"
          :href="manageAccountURL"
          :title="t('auth.manageAccount')"
        />
        <v-list-item
          prepend-icon="mdi-logout"
          @click="logout"
          :title="t('auth.logout')"
        />
      </v-list>
    </template>
  </v-navigation-drawer>
</template>
