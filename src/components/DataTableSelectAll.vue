<script setup lang="ts" generic="T">
/**
 * Select-all checkbox for a v-data-table with show-select, used in its
 * `header.data-table-select` slot:
 *
 *   <template #header.data-table-select="{ allSelected, someSelected, selectAll }">
 *     <DataTableSelectAll v-model="selected" v-bind="{ allSelected, someSelected, selectAll }" />
 *   </template>
 *
 * Vuetify's own checkbox only ever touches the rows on the current page, so
 * deselecting leaves rows on other pages selected, out of sight but still acted on
 * by bulk actions. This one selects the rows on the current page, but clears the
 * whole selection.
 */
const props = defineProps<{
  allSelected: boolean
  someSelected: boolean
  selectAll: (value: boolean) => void
}>()

const selected = defineModel<T[]>({ required: true })

function toggle() {
  if (props.allSelected) selected.value = []
  else props.selectAll(true)
}
</script>

<template>
  <v-checkbox-btn
    :model-value="allSelected"
    :indeterminate="someSelected && !allSelected"
    @update:model-value="toggle"
  />
</template>
