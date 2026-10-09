<script setup lang="ts">
import type { RGB } from '@/utils/color'

import { getProfileColorVars } from './useOrgProfile'

defineProps<{ color: RGB }>()
</script>

<template>
  <!-- A mock-up of a meeting in plain elements: Vuetify components with a
       theme class would redeclare the app-bar variables set here -->
  <div
    aria-hidden="true"
    class="profile-preview border rounded"
    :style="getProfileColorVars(color)"
  >
    <div class="app-bar">
      <img src="@/assets/voteit-logo.svg" alt="" class="logo" />
      <span class="avatar" />
    </div>
    <div class="body">
      <ul class="drawer">
        <li>
          <span class="heading">
            <v-icon icon="mdi-chevron-right" size="small" />
            {{ $t('meeting.meeting') }}
          </span>
        </li>
        <li>
          <span class="heading">
            <v-icon icon="mdi-chevron-down" size="small" />
            {{ $t('agenda.agenda') }}
          </span>
          <span class="sub-heading"><span class="bar" /></span>
          <span class="menu-item"><span class="bar" /></span>
          <span class="menu-item active"><span class="bar" /></span>
          <span class="menu-item"><span class="bar" /></span>
        </li>
        <li>
          <span class="heading">
            <v-icon icon="mdi-chevron-right" size="small" />
            {{ $t('poll.poll', 2) }}
          </span>
        </li>
      </ul>
      <div class="content">
        <span class="line w-50" />
        <span class="line" />
        <span class="line" />
        <span class="line w-75" />
      </div>
    </div>
    <div class="bubbles">
      <div class="bubble-content elevation-8 rounded">
        <span class="line" />
        <span class="line w-75" />
      </div>
      <span class="bubble">
        <v-icon icon="mdi-vote" size="small" />
      </span>
      <span class="bubble open">
        <v-icon icon="mdi-television-play" size="small" />
      </span>
    </div>
  </div>
</template>

<style scoped lang="sass">
// Mirrors AppBar, NavigationDrawer, MenuLevel, CollapsibleMenu and Bubbles
.profile-preview
  position: relative
  display: flex
  flex-direction: column
  height: 300px
  min-width: 280px
  overflow: hidden
  pointer-events: none
  user-select: none
  background-color: rgb(var(--v-theme-surface))

.app-bar
  display: flex
  align-items: center
  justify-content: space-between
  height: 40px
  padding: 0 12px
  flex: 0 0 auto
  background-color: rgb(var(--v-theme-app-bar))
  .logo
    width: 40px
    height: auto
    margin-top: 6px
  .avatar
    width: 24px
    height: 24px
    border-radius: 50%
    background-color: rgb(var(--v-theme-background))

.body
  display: flex
  flex: 1 1 auto
  min-height: 0

.drawer
  width: 40%
  flex: 0 0 auto
  list-style: none
  padding: 4px 0
  font-size: 10pt
  background-color: rgb(var(--v-theme-app-bar))
  color: rgb(var(--v-theme-on-app-bar))
  > li
    display: flex
    flex-direction: column
    padding: 6px 0
    border-top: 1px solid rgb(var(--v-theme-app-bar-divider))
    &:first-child
      border-top: 0
  .heading
    display: flex
    align-items: center
    gap: 4px
    padding: 0 8px
    white-space: nowrap
    overflow: hidden
    text-overflow: ellipsis
  .sub-heading
    margin: 6px 6px 4px 30px
    .bar
      width: 40%
      height: 5px
  .menu-item
    margin: 0 6px 4px 30px
    padding: 6px 8px
    border-radius: 5px
    background-color: rgba(var(--v-theme-surface), .08)
    &.active
      background-color: rgb(var(--v-theme-app-bar-active))
    &:last-child
      margin-bottom: 0
  .bar
    display: block
    width: 70%
    height: 6px
    border-radius: 3px
    background-color: rgb(var(--v-theme-on-app-bar))
    opacity: .7

.content
  flex: 1 1 auto
  padding: 16px

.line
  display: block
  height: 8px
  margin-bottom: 10px
  border-radius: 4px
  background-color: rgba(var(--v-theme-on-surface), .12)

.bubbles
  position: absolute
  right: 8px
  bottom: 8px
  display: flex
  gap: 6px
  .bubble
    display: flex
    align-items: center
    justify-content: center
    width: 40px
    height: 40px
    border-radius: 50%
    background-color: rgb(var(--v-theme-surface))
    border: 1px solid rgba(var(--v-theme-app-bar), .4)
    color: rgb(var(--v-theme-app-bar))
    &.open
      background-color: rgb(var(--v-theme-app-bar))
      color: rgb(var(--v-theme-on-app-bar))
  .bubble-content
    position: absolute
    right: 0
    bottom: 48px
    width: 140px
    padding: 12px 12px 2px
    background-color: rgb(var(--v-theme-surface))
</style>
