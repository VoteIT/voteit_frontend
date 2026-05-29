<script setup lang="ts">
import DefaultDialog from '@/components/DefaultDialog.vue'

interface AnnotatedDataType {
  name: string
  possibleValues?: {
    value: string
    description?: string
  }[]
}

defineProps<{ dataTypes: AnnotatedDataType[] }>()
</script>

<template>
  <v-table density="compact">
    <thead>
      <tr>
        <th v-for="{ name } in dataTypes" :key="name">
          {{ name }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th v-for="{ name, possibleValues } in dataTypes" :key="name">
          <DefaultDialog
            v-if="possibleValues"
            :title="$t('invites.annotate.possibleValuesFor', { name })"
          >
            <template #activator="{ props }">
              <v-btn
                variant="tonal"
                size="x-small"
                icon="mdi-help"
                v-bind="props"
              />
            </template>
            <template #default="{ close }">
              <v-table>
                <thead>
                  <tr>
                    <th>{{ $t('value') }}</th>
                    <th>{{ $t('description') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="{ description, value } in possibleValues"
                    :key="value"
                  >
                    <td>
                      <strong>{{ value }}</strong>
                    </td>
                    <td class="text-secondary">{{ description || '-' }}</td>
                  </tr>
                </tbody>
              </v-table>
              <div class="text-right">
                <v-btn
                  color="primary"
                  :text="$t('close')"
                  variant="elevated"
                  @click="close"
                />
              </div>
            </template>
          </DefaultDialog>
          <span v-else> ... </span>
        </th>
      </tr>
    </tbody>
  </v-table>
</template>
