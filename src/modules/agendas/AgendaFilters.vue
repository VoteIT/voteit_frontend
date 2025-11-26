<script lang="ts" setup>
import { ComponentPublicInstance, computed, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onClickOutside } from '@vueuse/core'

import BtnDropdown from '@/components/BtnDropdown.vue'
import Tag from '@/components/Tag.vue'

import { proposalStates } from '../proposals/workflowStates'

import useAgendaFilter from './useAgendaFilter'
import { agendaIdKey } from './injectionKeys'

const { t } = useI18n()
const agendaId = inject(agendaIdKey)
if (!agendaId) throw new Error('AgendaFilters required agendaId context')

const { agendaFilter, isModified, clearFilter, clearTag } = useAgendaFilter()
const root = ref<ComponentPublicInstance<{ close: () => void }> | null>(null)
onClickOutside(root, () => root.value?.close())

const orders = ref([
  {
    id: 'asc',
    label: t('oldestFirst')
  },
  {
    id: 'desc',
    label: t('newestFirst')
  }
] as const)

const states = computed(() =>
  proposalStates.map(({ state, getName }) => ({
    label: getName(t, 2), // Get name in plural
    state
  }))
)
</script>

<template>
  <BtnDropdown ref="root" right dense>
    <template v-slot:activator="{ toggle }">
      <span class="text-no-wrap">
        <v-btn
          :color="isModified ? 'warning' : undefined"
          :disabled="!isModified"
          icon="mdi-undo-variant"
          size="small"
          :title="$t('defaultFilters')"
          variant="text"
          @click="clearFilter"
        />
        <v-btn variant="text" @click="toggle" append-icon="mdi-chevron-down">
          <v-icon
            class="d-sm-none"
            :icon="isModified ? 'mdi-filter' : 'mdi-filter-outline'"
          />
          <span class="d-none d-sm-inline">{{ $t('sortAndFilter') }}</span>
        </v-btn>
      </span>
    </template>
    <v-list density="comfortable" class="agenda-filters">
      <template v-if="agendaFilter.tag">
        <v-list-subheader class="tag-header" :title="$t('tag')" />
        <v-list-item>
          <Tag
            class="mr-1"
            closer
            :name="agendaFilter.tag"
            @remove="clearTag"
          />
        </v-list-item>
        <v-divider />
      </template>
      <v-list-subheader :title="$t('sortBy')" />
      <v-item-group mandatory v-model="agendaFilter.order">
        <v-item
          v-for="f in orders"
          :value="f.id"
          v-slot="{ isSelected, toggle }"
        >
          <v-list-item
            :prepend-icon="
              isSelected ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank'
            "
            :title="f.label"
            @click="toggle"
          />
        </v-item>
      </v-item-group>
      <v-divider />
      <v-list-subheader :title="$t('state')" />
      <v-item-group mandatory multiple v-model="agendaFilter.states">
        <v-item
          v-for="{ label, state } in states"
          :value="state"
          v-slot="{ isSelected, toggle }"
        >
          <v-list-item
            :prepend-icon="
              isSelected ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'
            "
            :title="label"
            @click="toggle"
          />
        </v-item>
      </v-item-group>
    </v-list>
  </BtnDropdown>
</template>

<style lang="sass">
.agenda-filters
  min-width: 240px
  .tag-header
    margin-bottom: -1em
  .v-list-item
    border-radius: 0
  .v-list-item-avatar .v-icon
    font-size: 16pt
</style>
