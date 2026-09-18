<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

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
  <div v-if="primary" class="d-flex text-no-wrap" :class="{ 'w-100': block }">
    <v-btn
      :class="{ 'flex-grow-1': block, 'rounded-e-0 pr-2': rest.length }"
      color="primary"
      :disabled="!orgStore.canLogin"
      :href="loginURL(primary)"
      prepend-icon="mdi-login"
      :text="primaryText"
      variant="flat"
    />
    <v-menu v-if="rest.length" location="bottom end">
      <template #activator="{ props: activator }">
        <v-btn
          :aria-label="$t('auth.moreLoginOptions')"
          class="rounded-s-0 chevron pl-2 pr-3"
          color="primary"
          :disabled="!orgStore.canLogin"
          variant="flat"
          v-bind="activator"
        >
          <v-icon>mdi-chevron-down</v-icon>
        </v-btn>
      </template>
      <v-list density="comfortable">
        <v-list-item
          v-for="provider in rest"
          :key="provider.provider_id"
          :href="loginURL(provider)"
          prepend-icon="mdi-login"
          :title="$t('auth.loginWith', { title: provider.title })"
        />
      </v-list>
    </v-menu>
  </div>
</template>

<style lang="sass" scoped>
.chevron
  min-width: 0 !important
</style>
