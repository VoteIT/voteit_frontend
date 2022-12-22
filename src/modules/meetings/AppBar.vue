<template>
  <AppBar :title="meeting?.title" />
</template>

<script lang="ts" setup>
import AppBar from '@/components/AppBar.vue'

import useMeeting from './useMeeting'

const { meeting } = useMeeting()
</script>
