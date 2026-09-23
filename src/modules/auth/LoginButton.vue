<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import ButtonWithDropdown from '@/components/ButtonWithDropdown.vue'
import useOrgStore from '@/modules/organisations/useOrgStore'
import { LoginProvider } from '@/modules/organisations/types'

const props = defineProps<{
  /** Fill the width of whatever it's in. */
  block?: boolean
  /** Where to come back to. Defaults to the page we're on. */
  next?: string
}>()

const { t } = useI18n()
const orgStore = useOrgStore()

const primary = computed(() => orgStore.primaryProvider)
const rest = computed(() => orgStore.providers.slice(1))

/**
 * With one provider the choice isn't a choice, so the organisation is what's
 * worth naming. With several, which service it is becomes the useful part.
 */
const primaryText = computed(() =>
  rest.value.length
    ? t('auth.loginWith', { title: primary.value!.title })
    : t('organization.loginTo', { title: orgStore.organisation?.title })
)

function loginURL(provider: LoginProvider) {
  return orgStore.getLoginURL(provider, props.next)
}
</script>

<template>
  <ButtonWithDropdown
    v-if="primary"
    :block="block"
    color="primary"
    :disabled="!orgStore.canLogin"
    :href="loginURL(primary)"
    :menu-label="$t('auth.moreLoginOptions')"
    prepend-icon="mdi-login"
    :text="primaryText"
  >
    <template v-if="rest.length" #default>
      <v-list density="comfortable">
        <v-list-item
          v-for="provider in rest"
          :key="provider.provider_id"
          :href="loginURL(provider)"
          prepend-icon="mdi-login"
          :title="$t('auth.loginWith', { title: provider.title })"
        />
      </v-list>
    </template>
  </ButtonWithDropdown>
</template>
