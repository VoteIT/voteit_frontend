<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useTitle } from '@vueuse/core'

import AppBar from '@/components/AppBar.vue'
import UserMenu from '@/components/UserMenu.vue'
import usePermission from '@/composables/usePermission'
import { cols } from '@/utils/defaults'

import OrgToolbar from './OrgToolbar.vue'
import useOrgControlPanel from './useOrgControlPanel'
import useOrgStore from './useOrgStore'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const orgStore = useOrgStore()
const { panels } = useOrgControlPanel()

usePermission(computed(() => orgStore.canChangeOrganisation))

const panelId = computed(() => route.params.panel as string | undefined)
const currentPanel = computed(() =>
  panels.value.find((p) => p.id === panelId.value && p.component)
)

// Unknown or inactive panel, or one without a detail view - show them all instead
watch(
  [panelId, currentPanel],
  () => {
    if (panelId.value && !currentPanel.value && orgStore.organisation)
      router.replace({ name: 'orgControlPanel' })
  },
  { immediate: true }
)

useTitle(
  computed(() =>
    [
      currentPanel.value?.title,
      t('organization.controlPanel'),
      orgStore.organisation?.title ?? 'VoteIT'
    ]
      .filter(Boolean)
      .join(' | ')
  )
)
</script>

<template>
  <AppBar />
  <UserMenu />
  <v-main>
    <OrgToolbar />
    <v-container>
      <v-row v-if="currentPanel" class="my-4">
        <v-col v-bind="cols.default">
          <h1 class="mb-4">{{ currentPanel.title }}</h1>
          <component :is="currentPanel.component" />
        </v-col>
      </v-row>
      <v-row v-else id="org-panels" class="my-4">
        <v-col class="grid">
          <v-card
            v-for="{
              description,
              icon,
              id,
              requiresAttention,
              title,
              to
            } in panels"
            :key="id"
            :text="description"
            :to="to"
          >
            <template #title>
              <div class="d-flex ga-2">
                <v-icon :icon="icon" />
                <span class="flex-grow-1 text-truncate">
                  {{ title }}
                </span>
                <v-icon
                  v-if="requiresAttention"
                  color="warning"
                  icon="mdi-alert-circle"
                />
                <v-icon v-if="to" icon="mdi-chevron-right" />
              </div>
            </template>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<style lang="sass" scoped>
@use 'vuetify/lib/styles/tools/display'

#org-panels
  a
    text-decoration: none

.grid
  display: grid
  width: 100%
  gap: 1rem
  grid-template-columns: repeat(var(--cols, 1), 1fr)
  +display.media-breakpoint-up(sm)
    --cols: 2
  +display.media-breakpoint-up(lg)
    --cols: 3
  +display.media-breakpoint-up(xl)
    --cols: 4
</style>
