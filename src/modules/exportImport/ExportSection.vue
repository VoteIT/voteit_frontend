<script lang="ts" setup>
import { sorted } from 'itertools'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { meetingExportPlugins } from './registry'
import useMeeting from '../meetings/useMeeting'

const { t } = useI18n()

const { meeting, meetingId } = useMeeting()

function* iterDownloads(
  defaultTitle: string,
  exports: { title?: string; formats: { format: string; url: string }[] }[]
) {
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
  return sorted(
    plugins
      .map(({ id, getExports, getTitle }) => {
        const title = getTitle(t)
        return {
          id,
          exports: [...iterDownloads(title, getExports(meetingId.value))],
          title
        }
      })
      .filter((e) => e.exports.length),
    (o) => o.title.toLocaleLowerCase()
  )
})
</script>

<template>
  <div>
    <header class="mb-6">
      <h2>
        {{ $t('exportImport.exports') }}
      </h2>
      <i18n-t keypath="exportImport.exportsLongDescription">
        <template #csv>
          <a
            href="https://en.wikipedia.org/wiki/Comma-separated_values"
            target="_blank"
            >CSV</a
          >
        </template>
        <template #json>
          <a href="https://en.wikipedia.org/wiki/JSON" target="_blank">JSON</a>
        </template>
      </i18n-t>
    </header>
    <v-list class="my-2" rounded>
      <v-list-item
        v-for="{ exports, id, title } in exportPlugins"
        :key="id"
        :title="title"
      >
        <template #append>
          <v-menu location="bottom right">
            <template #activator="{ props }">
              <v-btn
                append-icon="mdi-chevron-down"
                color="primary"
                :text="$t('download')"
                variant="flat"
                v-bind="props"
              />
            </template>
            <v-list>
              <v-list-item
                v-for="{ title, url } in exports"
                :key="url"
                append-icon="mdi-download"
                target="_blank"
                :href="url"
                :title="title"
              />
            </v-list>
          </v-menu>
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>
