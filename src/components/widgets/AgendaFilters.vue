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
          <input type="radio" name="order-by" :id="`proposal-order-filter-${f.id}`" :value="f.id" v-model="filter.order">
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
import { ComponentPublicInstance, computed, defineComponent, PropType, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { onClickOutside } from '@vueuse/core'

import BtnDropdown from '@/components/BtnDropdown.vue'

import workflowStates, { ProposalState } from '@/contentTypes/proposal/workflowStates'

import { DEFAULT_FILTER_STATES, Filter } from './types'

interface FilterDescription {
  id: string
  label: string
  active?: boolean
}

function setEqual (a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false
  for (const v of a) if (!b.has(v)) return false
  return true
}

export default defineComponent({
  props: {
    modelValue: {
      type: Object as PropType<Filter>,
      required: true
    },
    tags: {
      type: Set as PropType<Set<string>>,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    const { t } = useI18n()
    const root = ref<ComponentPublicInstance<{ close:() => void }> | null>(null)
    const filter = reactive<Filter>(props.modelValue)
    const isModified = computed(() => props.modelValue.order !== 'created' || !!props.modelValue.tags.size || !setEqual(props.modelValue.states, DEFAULT_FILTER_STATES))
    onClickOutside(root, () => {
      root.value && root.value.close()
    })

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
      active: props.modelValue.states.has(state.state)
    })))
    const tagFilters = reactive<FilterDescription[]>([...props.tags].map(tag => ({
      id: tag,
      label: tag,
      active: props.modelValue.tags.has(tag)
    })))
    watch(() => props.tags, value => {
      // add missing
      for (const tag of value) {
        if (!tagFilters.find(tf => tf.id === tag)) {
          tagFilters.push({
            id: tag,
            label: tag,
            active: false
          })
        }
      }
    })

    function clearFilters () {
      filter.order = 'created'
      for (const s of states) s.active = DEFAULT_FILTER_STATES.has(s.id as ProposalState)
      for (const t of tagFilters) t.active = false
    }
    watch(filter, value => {
      emit('update:modelValue', value)
    })
    watch(states, (value: FilterDescription[]) => {
      filter.states = new Set(value.filter(f => f.active).map(f => f.id) as ProposalState[])
    })
    watch(tagFilters, (value: FilterDescription[]) => {
      filter.tags = new Set(value.filter(tf => tf.active).map(tf => tf.id))
    })
    function setTag (tag: string) {
      for (const tf of tagFilters) {
        if (tf.id === tag) tf.active = true
      }
    }

    return {
      t,
      clearFilters,
      filter,
      isModified,
      orders,
      root,
      setTag,
      states,
      tagFilters
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
