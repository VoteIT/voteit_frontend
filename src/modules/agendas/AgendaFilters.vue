<template>
  <BtnDropdown ref="root" right>
    <template v-slot:activator="{ toggle }">
      <v-btn :color="isModified ? 'warning' : undefined" variant="text" @click="toggle()" append-icon="mdi-chevron-down">
        {{ t('sortAndFilter') }}
      </v-btn>
    </template>
    <template v-slot>
      <div class="proposal-filters">
        <h3>{{ t('orderBy')}}</h3>
        <div class="option" v-for="f in orders" :key="f.id">
          <input type="radio" name="order-by" :id="`proposal-order-filter-${f.id}`" :value="f.id" v-model="activeFilter.order">
          <label :for="`proposal-order-filter-${f.id}`">{{ f.label }}</label>
        </div>
        <v-divider/>
        <h3>{{ t('state') }}</h3>
        <div class="option" v-for="f in states" :key="f.id">
          <input type="checkbox" :id="`proposal-state-filter-${f.id}`" v-model="f.active">
          <label :for="`proposal-state-filter-${f.id}`">{{ f.label }}</label>
        </div>
        <v-divider/>
        <template v-if="tagFilters.length">
          <h3>{{ t('tags') }}</h3>
          <div class="option" v-for="f in tagFilters" :key="f.id">
            <input type="checkbox" :id="`proposal-filter-${f.id}`" v-model="f.active">
            <label :for="`proposal-filter-${f.id}`">
              <Tag :name="f.id" disabled />
            </label>
          </div>
          <v-divider/>
        </template>
        <h3>{{ t('reset') }}</h3>
        <v-btn block variant="text" :disabled="!isModified" @click="clearFilters()" prepend-icon="mdi-undo-variant">
          {{ t('defaultFilters') }}
        </v-btn>
      </div>
    </template>
  </BtnDropdown>
</template>

<script lang="ts">
import { ComponentPublicInstance, defineComponent, inject, reactive, Ref, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { onClickOutside } from '@vueuse/core'

import BtnDropdown from '@/components/BtnDropdown.vue'

import workflowStates, { DEFAULT_FILTER_STATES, ProposalState } from '@/contentTypes/proposal/workflowStates'

import { TagsKey } from '@/modules/meetings/useTags'
import useAgendaFilter from './useAgendaFilter'

interface FilterDescription {
  id: string
  label: string
  active?: boolean
}

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const { activeFilter, isModified } = useAgendaFilter()
    const tags = inject(TagsKey) as Ref<Set<string>>
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
    const states = reactive<FilterDescription[]>(workflowStates.map(state => ({
      id: state.state,
      label: t(`workflowState.${state.state}`),
      active: activeFilter.value.states.has(state.state)
    })))
    const tagFilters = reactive<FilterDescription[]>([...tags.value].map(tag => ({
      id: tag,
      label: tag,
      active: activeFilter.value.tags.has(tag)
    })))

    watch(tags, value => {
      // add missing
      for (const tag of value) {
        if (!tagFilters.find(tf => tf.id === tag)) {
          tagFilters.push({
            id: tag,
            label: tag,
            active: activeFilter.value.tags.has(tag)
          })
        }
      }
    })

    function clearFilters () {
      activeFilter.value.order = 'created'
      for (const s of states) s.active = DEFAULT_FILTER_STATES.includes(s.id as ProposalState)
      for (const t of tagFilters) t.active = false
    }
    function setTag (tag: string) {
      for (const tf of tagFilters) {
        if (tf.id === tag) tf.active = true
      }
    }

    watch(states, (value: FilterDescription[]) => {
      activeFilter.value.states = new Set(value.filter(f => f.active).map(f => f.id) as ProposalState[])
    })
    watch(tagFilters, (value: FilterDescription[]) => {
      activeFilter.value.tags = new Set(value.filter(f => f.active).map(f => f.id))
    })

    return {
      t,
      activeFilter,
      isModified,
      orders,
      root,
      states,
      tagFilters,
      clearFilters,
      setTag
    }
  },
  components: {
    BtnDropdown
  }
})
</script>

<style lang="sass">
.proposal-filters
  min-width: 280px
  h3
    font-size: 9pt
    font-weight: 500
    color: rgb(var(--v-theme-secondary))
    margin: .5em
  hr
    margin: 10px -10px
  .option
    display: flex
    input
      margin: 5px
    label
      flex: 1 1 auto
      margin: 2px

  .v-btn--block
    justify-content: start
</style>
