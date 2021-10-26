<template>
  <BtnDropdown ref="root" right dense>
    <template v-slot:activator="{ toggle }">
      <span class="text-no-wrap">
        <v-btn size="small" color="warning" variant="text" icon="mdi-undo-variant" @click="clearFilters()" :disabled="!isModified" :title="t('defaultFilters')" />
        <v-btn variant="text" @click="toggle()" append-icon="mdi-chevron-down">
          <v-icon class="d-sm-none" :icon="isModified ? 'mdi-filter' : 'mdi-filter-outline'" />
          <span class="d-none d-sm-inline">{{ t('sortAndFilter') }}</span>
        </v-btn>
      </span>
    </template>
    <v-list density="comfortable" class="agenda-filters">
      <template v-if="activeFilter.tags.size">
        <v-list-subheader class="tag-header">{{ t('tag')}}</v-list-subheader>
        <v-list-item>
          <Tag class="mr-1" closer v-for="tag in activeFilter.tags" :key="tag" :name="tag" @remove="activeFilter.tags.delete(tag)" />
        </v-list-item>
        <v-divider/>
      </template>
      <v-list-subheader>{{ t('orderBy')}}</v-list-subheader>
      <v-list-item :prepend-icon="activeFilter.order === f.id ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank'" v-for="f in orders" :key="f.id" @click="activeFilter.order = f.id" @keydown.space.enter.prevent="activeFilter.order = f.id">
        {{ f.label }}
      </v-list-item>
      <v-divider/>
      <v-list-subheader>{{ t('state') }}</v-list-subheader>
      <v-list-item :prepend-icon="f.active ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'" v-for="f in states" :key="f.id" @click="f.active = !f.active" @keydown.space.enter.prevent="f.active = !f.active">
        {{ f.label }}
      </v-list-item>
    </v-list>
  </BtnDropdown>
</template>

<script lang="ts">
import { ComponentPublicInstance, defineComponent, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { onClickOutside } from '@vueuse/core'

import BtnDropdown from '@/components/BtnDropdown.vue'

import { DEFAULT_FILTER_STATES, proposalStates } from '@/modules/proposals/workflowStates'

// import { TagsKey } from '@/modules/meetings/useTags'
import useAgendaFilter from './useAgendaFilter'
import { ProposalState } from '../proposals/types'

interface FilterDescription {
  id: string
  label: string
  active?: boolean
}

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const { activeFilter, isModified } = useAgendaFilter()
    // const tags = inject(TagsKey) as Ref<Set<string>>
    const root = ref<ComponentPublicInstance<{ close:() => void }> | null>(null)
    onClickOutside(root, () => root.value?.close())

    const orders = ref<FilterDescription[]>([
      {
        id: 'created',
        label: t('oldestFirst')
      },
      {
        id: '-created',
        label: t('newestFirst')
      }
    ])
    const states = reactive<FilterDescription[]>(proposalStates.map(state => ({
      id: state.state,
      label: t(`workflowState.${state.state}`),
      active: activeFilter.value.states.has(state.state)
    })))
    // const tagFilters = reactive<FilterDescription[]>([...tags.value].map(tag => ({
    //   id: tag,
    //   label: tag,
    //   active: activeFilter.value.tags.has(tag)
    // })))

    // watch(tags, value => {
    //   // add missing
    //   for (const tag of value) {
    //     if (!tagFilters.find(tf => tf.id === tag)) {
    //       tagFilters.push({
    //         id: tag,
    //         label: tag,
    //         active: activeFilter.value.tags.has(tag)
    //       })
    //     }
    //   }
    // })

    function clearFilters () {
      activeFilter.value.order = 'created'
      for (const s of states) s.active = DEFAULT_FILTER_STATES.includes(s.id as ProposalState)
      // for (const t of tagFilters) t.active = false
      activeFilter.value.tags.clear()
    }
    // function setTag (tag: string) {
    //   for (const tf of tagFilters) {
    //     if (tf.id === tag) tf.active = true
    //   }
    // }

    watch(states, (value: FilterDescription[]) => {
      activeFilter.value.states = new Set(value.filter(f => f.active).map(f => f.id) as ProposalState[])
    })
    // watch(tagFilters, (value: FilterDescription[]) => {
    //   activeFilter.value.tags = new Set(value.filter(f => f.active).map(f => f.id))
    // })

    return {
      t,
      activeFilter,
      isModified,
      orders,
      root,
      states,
      clearFilters
    }
  },
  components: {
    BtnDropdown
  }
})
</script>

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
