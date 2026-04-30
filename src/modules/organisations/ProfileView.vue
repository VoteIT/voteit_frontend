<script setup lang="ts">
import { computed, shallowReactive, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { getFullName } from '@/utils'
import { cols } from '@/utils/defaults'
import AppBar from '@/components/AppBar.vue'
import UserMenu from '@/components/UserMenu.vue'
import useRules from '@/composables/useRules'
import DefaultDialog from '@/components/DefaultDialog.vue'
import DefaultForm from '@/components/DefaultForm.vue'
import ImageField from '@/components/inputs/ImageField.vue'
import SlugField from '@/components/inputs/SlugField.vue'
import useAuthStore from '../auth/useAuthStore'

import useOrgStore from './useOrgStore'
import { IUser } from './types'
import { profileType } from './contentTypes'
import SwitchProfileDialog from './SwitchProfileDialog.vue'
import { parseRestError } from '@/utils/restApi'
import QueryDialog from '@/components/QueryDialog.vue'

const authStore = useAuthStore()
const store = useOrgStore()

const { t } = useI18n()
const rules = useRules(t)

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

const image = shallowReactive({
  blob: null as Blob | null,
  errors: undefined as { image?: string[] } | undefined,
  saving: false
})

async function saveImage(close: () => void) {
  if (!image.blob) throw new Error('No image to upload')
  image.saving = true
  try {
    await authStore.uploadProfileImage(image.blob)
    close()
  } catch (e) {
    image.errors = parseRestError(e)
    console.error('Failed to upload profile image', e)
  }
  image.saving = false
}
</script>

<template>
  <AppBar />
  <UserMenu />
  <v-main>
    <v-container>
      <v-row>
        <v-col v-if="authStore.user" class="mb-6" v-bind="cols.default">
          <h1 class="mb-2">
            {{ $t('organization.yourProfile', { ...store.organisation }) }}
          </h1>
          <i18n-t keypath="organization.profilePageIntro" tag="p">
            <template #title>
              <em>{{ store.organisation?.title }}</em>
            </template>
          </i18n-t>
        </v-col>
      </v-row>
      <v-row v-if="authStore.user">
        <v-col class="d-flex flex-column ga-4" v-bind="cols.wideLeft.left">
          <v-sheet class="d-flex ga-4 pa-4" border rounded>
            <div v-if="authStore.userImage" class="flex-shrink-0">
              <v-avatar :image="authStore.userImage" size="80px" />
            </div>
            <div class="flex-grow-1">
              <h2>{{ getFullName(authStore.user) }}</h2>
              <p class="text-grey mb-1">{{ authStore.user.userid }}</p>
              <p v-if="authStore.user.email">{{ authStore.user.email }}</p>
            </div>
            <div class="flex-shrink-0 d-flex flex-column ga-1">
              <DefaultDialog
                :title="$t('organization.editProfile')"
                @open="fetchEmailChoices"
              >
                <template #activator="{ props }">
                  <v-btn
                    class="d-none d-sm-block"
                    :text="$t('edit')"
                    variant="tonal"
                    v-bind="props"
                  />
                  <v-btn
                    class="d-sm-none"
                    icon="mdi-pencil"
                    variant="tonal"
                    v-bind="props"
                  />
                </template>
                <template v-slot="{ close }">
                  <v-alert
                    :text="$t('profile.editProfileHelp')"
                    type="info"
                    class="my-4"
                  />
                  <v-defaults-provider
                    :defaults="{ VList: { bgColor: 'surface' } }"
                  >
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
              <DefaultDialog :title="$t('img.change')">
                <template #activator="{ props }">
                  <v-btn
                    class="d-none d-sm-block"
                    :text="$t('img.change')"
                    variant="tonal"
                    v-bind="props"
                  />
                  <v-btn
                    class="d-sm-none"
                    icon="mdi-image-edit"
                    variant="tonal"
                    v-bind="props"
                  />
                </template>
                <template #default="{ close }">
                  <v-card
                    v-if="authStore.user.image && authStore.user.img_url"
                    class="mb-4"
                    color="grey-lighten-4"
                    :text="$t('img.externalSourceExplanation')"
                    :title="$t('img.fromExternalSource')"
                  >
                    <template #append>
                      <v-avatar
                        :image="authStore.user.img_url"
                        size="x-large"
                      />
                    </template>
                    <template #actions>
                      <QueryDialog
                        color="warning"
                        :text="$t('img.clearUploadedConfirmation')"
                        @confirmed="authStore.clearProfileImage"
                      >
                        <template #activator="{ props }">
                          <v-btn
                            color="warning"
                            prepend-icon="mdi-delete"
                            :text="$t('img.clearUploaded')"
                            v-bind="props"
                          />
                        </template>
                      </QueryDialog>
                    </template>
                  </v-card>
                  <ImageField
                    crop
                    :error-messages="image.errors?.image"
                    :src="authStore.userImage"
                    v-model="image.blob"
                  />
                  <div class="text-right">
                    <v-btn
                      color="primary"
                      :text="$t('cancel')"
                      variant="text"
                      @click="close"
                    />
                    <v-btn
                      color="primary"
                      :disabled="!image.blob"
                      :loading="image.saving"
                      prepend-icon="mdi-upload"
                      :text="$t('img.upload')"
                      @click="saveImage(close)"
                    />
                  </div>
                </template>
              </DefaultDialog>
            </div>
          </v-sheet>
          <v-alert
            v-if="authStore.alternateUsers.length"
            class="mb-4"
            icon="mdi-account-switch"
            :title="$t('auth.switchUserTitle')"
            :text="$t('auth.switchUserText')"
          >
            <template #append>
              <SwitchProfileDialog>
                <template #activator="{ props }">
                  <v-btn
                    class="d-none d-sm-block"
                    :text="$t('organization.switchProfile')"
                    variant="tonal"
                    v-bind="props"
                  />
                  <v-btn
                    class="d-sm-none"
                    icon="mdi-account-arrow-right"
                    variant="tonal"
                    v-bind="props"
                  />
                </template>
              </SwitchProfileDialog>
            </template>
          </v-alert>
        </v-col>
        <v-col v-bind="cols.wideLeft.right">
          <v-alert
            icon="mdi-cookie"
            type="info"
            :text="$t('organization.gdpr.text')"
            :title="$t('organization.gdpr.title')"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>
