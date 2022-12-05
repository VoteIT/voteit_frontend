<template>
  <div>
    <h1>
      {{ t('meeting.exports') }}
    </h1>
    <v-table class="my-2">
      <thead>
        <tr>
          <th colspan="2">
            Export
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="{ exports, id, title } in exportPlugins" :key="id">
          <td>
            {{ title }}
          </td>
          <td class="text-right">
            <v-menu>
              <template #activator="{ props }">
                <v-btn v-bind="props" append-icon="mdi-download" variant="tonal" color="primary">
                  {{ t('download') }}
                </v-btn>
              </template>
              <v-list>
                <template v-for="e, i in exports" :key="i">
                </template>
                <v-list-item
                  v-for="{ title, url } in exports" :key="url"
                  append-icon="mdi-file-download"
                  target="_blank"
                  :href="url"
                  :title="title"
                />
              </v-list>
            </v-menu>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script lang="ts" setup>
import { sortBy } from 'lodash'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { meetingExportPlugins } from './registry'
import useMeeting from './useMeeting'

const { t } = useI18n()

const { meeting, meetingId } = useMeeting()

function * iterDownloads (defaultTitle: string, exports: { title?: string, formats: { format: string, url: string }[]}[]) {
  for (const { title, formats } of exports) {
    for (const { format, url } of formats) {
      yield {
        title: `${title || defaultTitle} (${format.toUpperCase()})`,
        url
      }
    }
  }
}

const exportPlugins = computed(() => {
  if (!meeting.value) return []
  const plugins = meetingExportPlugins.getActivePlugins(meeting.value)
  return sortBy(plugins
    .map(({ id, getExports, getTitle }) => {
      const title = getTitle(t)
      return {
        id,
        exports: [...iterDownloads(title, getExports(t, meetingId.value))],
        title
      }
    })
    .filter(e => e.exports.length),
    'title'
  )
})
</script>
