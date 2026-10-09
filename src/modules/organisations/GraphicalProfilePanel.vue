<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'

import {
  contrastRatio,
  hasWhiteTextContrast,
  MIN_CONTRAST,
  parseHex,
  type RGB,
  WHITE
} from '@/utils/color'

import QueryDialog from '@/components/QueryDialog.vue'
import useErrorHandler from '@/composables/useErrorHandler'

import useOrgProfile, { isSvgFile } from './useOrgProfile'

const { t } = useI18n()
const theme = useTheme()
const { logoUrl, profileColor, setLogo, setProfileColor } = useOrgProfile()
const { handled } = useErrorHandler({ target: 'alert' })

const defaultColor = parseHex(theme.current.value.colors['app-bar'])

const draftColor = ref<RGB>({ ...(profileColor.value ?? defaultColor) })
const contrastOk = computed(() => hasWhiteTextContrast(draftColor.value))
const colorChanged = computed(() => {
  const current = profileColor.value ?? defaultColor
  return (['r', 'g', 'b'] as const).some(
    (c) => current[c] !== draftColor.value[c]
  )
})

function contrastRule(color: RGB) {
  return (
    hasWhiteTextContrast(color) ||
    t('organization.graphicalProfile.contrastWarning', {
      contrast: contrastRatio(color, WHITE).toFixed(1),
      min: MIN_CONTRAST
    })
  )
}

const savingColor = ref(false)

async function saveProfileColor(color?: RGB) {
  savingColor.value = true
  await handled(() => setProfileColor(color))
  savingColor.value = false
}

function saveColor() {
  if (contrastOk.value) saveProfileColor(draftColor.value)
}

async function resetColor() {
  await saveProfileColor(undefined)
  if (!profileColor.value) draftColor.value = { ...defaultColor }
}

const logoFile = ref<File | null>(null)
const savingLogo = ref(false)

function svgRule(file: File | null) {
  return !file || isSvgFile(file) || t('organization.graphicalProfile.onlySvg')
}

async function saveLogo(file?: File) {
  savingLogo.value = true
  await handled(async () => {
    await setLogo(file)
    logoFile.value = null
  })
  savingLogo.value = false
}

function uploadLogo() {
  if (logoFile.value && isSvgFile(logoFile.value)) saveLogo(logoFile.value)
}
</script>

<template>
  <h2 class="mb-2">{{ $t('organization.graphicalProfile.color') }}</h2>
  <p class="mb-4">{{ $t('organization.graphicalProfile.colorHelp') }}</p>
  <div class="d-flex flex-wrap ga-4 mb-4">
    <!-- v-color-picker can't validate, v-input lends it rules and messages -->
    <!-- Picker width, so a long message wraps under the picker instead of
         widening the row -->
    <v-input
      class="flex-0-0"
      :model-value="draftColor"
      :rules="[contrastRule]"
      width="300"
    >
      <v-color-picker
        :modes="['rgb', 'hex']"
        mode="hex"
        elevation="0"
        border
        v-model="draftColor"
      />
    </v-input>
    <div
      class="flex-grow-1 align-self-start rounded pa-4 text-h6 text-white"
      :style="{
        backgroundColor: `rgb(${draftColor.r}, ${draftColor.g}, ${draftColor.b})`
      }"
    >
      {{ $t('organization.graphicalProfile.preview') }}
    </div>
  </div>
  <div class="d-flex ga-2 mb-8">
    <v-spacer />
    <QueryDialog
      color="warning"
      :confirm-text="$t('reset')"
      :text="$t('organization.graphicalProfile.resetColorConfirm')"
      @confirmed="resetColor"
    >
      <template #activator="{ props }">
        <v-btn
          :disabled="!profileColor || savingColor"
          :text="$t('reset')"
          variant="text"
          v-bind="props"
        />
      </template>
    </QueryDialog>
    <QueryDialog
      color="warning"
      :confirm-text="$t('save')"
      :text="$t('organization.graphicalProfile.saveColorConfirm')"
      @confirmed="saveColor"
    >
      <template #activator="{ props }">
        <v-btn
          color="primary"
          :disabled="!contrastOk || !colorChanged"
          :loading="savingColor"
          :text="$t('save')"
          v-bind="props"
        />
      </template>
    </QueryDialog>
  </div>

  <v-divider class="my-6" />

  <h2 class="mb-2">{{ $t('organization.graphicalProfile.logo') }}</h2>
  <p class="mb-4">{{ $t('organization.graphicalProfile.logoHelp') }}</p>
  <!-- Button in the append slot shares the field's row, so the error message
       goes under both and doesn't stretch the button -->
  <v-file-input
    accept=".svg,image/svg+xml"
    class="logo-input mb-2"
    :label="$t('organization.graphicalProfile.logoSelect')"
    prepend-icon="mdi-image"
    rounded="te-0"
    :rules="[svgRule]"
    v-model="logoFile"
  >
    <template #append>
      <v-btn
        class="rounded-s-0 h-auto"
        color="primary"
        :disabled="!logoFile || !isSvgFile(logoFile)"
        :loading="savingLogo"
        prepend-icon="mdi-upload"
        :text="$t('upload')"
        @click="uploadLogo"
      />
    </template>
  </v-file-input>
  <v-sheet v-if="logoUrl" border rounded class="pa-4 d-flex align-center">
    <img :src="logoUrl" alt="" class="logo-preview" />
    <v-spacer />
    <QueryDialog
      color="warning"
      :confirm-text="$t('organization.graphicalProfile.removeLogo')"
      :text="$t('organization.graphicalProfile.removeLogoConfirm')"
      @confirmed="saveLogo(undefined)"
    >
      <template #activator="{ props }">
        <v-btn
          :disabled="savingLogo"
          prepend-icon="mdi-delete"
          :text="$t('organization.graphicalProfile.removeLogo')"
          variant="text"
          v-bind="props"
        />
      </template>
    </QueryDialog>
  </v-sheet>
</template>

<style scoped lang="sass">
// Joined to the field like UserSearch, button stretched to the field's height
.logo-input :deep(.v-input__append)
  align-items: stretch
  margin-inline-start: 0
  padding-top: 0

.logo-preview
  max-height: 96px
  max-width: 60%
</style>
