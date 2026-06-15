<script lang="ts" setup>
import ImportSection from './ImportSection.vue'
import ExportSection from './ExportSection.vue'
import DownloadSection from './DownloadSection.vue'
</script>

<template>
  <div>
    <h1 class="mb-6">{{ $t('exportImport.importAndExport') }}</h1>
    <ImportSection class="mb-8" />
    <v-divider class="my-6" />
    <ExportSection />
    <v-divider class="my-6" />
    <DownloadSection />
  </div>
</template>
