<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { type RouteLocationRaw, useRoute } from 'vue-router'

import ButtonWithDropdown from '@/components/ButtonWithDropdown.vue'

import useOrgControlPanel from './useOrgControlPanel'
import useOrgStore from './useOrgStore'

const { t } = useI18n()
const route = useRoute()
const orgStore = useOrgStore()
const { attentionCount, panels } = useOrgControlPanel()

const detailPanels = computed(() => panels.value.filter((p) => p.to))

const inControlPanel = computed(() => route.name === 'orgControlPanel')
const currentPanel = computed(() =>
  detailPanels.value.find((p) => p.id === route.params.panel)
)

const breadcrumbs = computed(() => {
  const items: { title: string; to?: RouteLocationRaw }[] = [
    { title: t('home.home'), to: { name: 'home' } },
    {
      title: t('organization.controlPanel'),
      to: { name: 'orgControlPanel' }
    }
  ]
  if (currentPanel.value)
    items.push({ title: currentPanel.value.title, to: currentPanel.value.to })
  return items
})
</script>

<template>
  <v-toolbar
    v-if="orgStore.canChangeOrganisation"
    color="secondary-lighten-2"
    elevation="1"
    class="text-black d-print-none"
    density="compact"
    :title="inControlPanel ? undefined : $t('role.org_manager')"
  >
    <v-breadcrumbs v-if="inControlPanel" :items="breadcrumbs" />
    <template v-else>
      <v-spacer />
      <v-badge
        :content="attentionCount"
        :model-value="!!attentionCount"
        color="warning"
        class="mr-4"
      >
        <ButtonWithDropdown
          color="primary"
          :menu-label="$t('organization.controlPanel')"
          prepend-icon="mdi-cog"
          :text="$t('organization.controlPanel')"
          :to="{ name: 'orgControlPanel' }"
          variant="tonal"
        >
          <template v-if="detailPanels.length" #default>
            <v-list>
              <v-list-item
                v-for="{
                  icon,
                  id,
                  requiresAttention,
                  title,
                  to
                } in detailPanels"
                :key="id"
                :prepend-icon="icon"
                :title="title"
                :to="to"
              >
                <template v-if="requiresAttention" #append>
                  <v-icon color="warning" icon="mdi-alert-circle" />
                </template>
              </v-list-item>
            </v-list>
          </template>
        </ButtonWithDropdown>
      </v-badge>
    </template>
  </v-toolbar>
</template>
