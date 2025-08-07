<script setup lang="ts">
import { computed } from 'vue'

import DefaultDialog from '@/components/DefaultDialog.vue'

import useParticipantTags from '@/modules/meetings/participantTags/useParticipantTags'
import useMeetingId from '@/modules/meetings/useMeetingId'
import { user } from '@/composables/useAuthentication'
import { translateGender } from './utils'
import { useI18n } from 'vue-i18n'
import { sorted } from 'itertools'

const GENDER_ICONS = {
  f: 'mdi-gender-female',
  m: 'mdi-gender-male',
  nb: 'mdi-gender-non-binary'
} as const

const { t } = useI18n()
const meetingId = useMeetingId()
const { getUserTags, removeNamespace, setTags } = useParticipantTags(meetingId)
const genderTag = computed(() =>
  user.value
    ? (getUserTags(user.value.pk, 'gen').at(0)?.split(':')[1] as GenderTag)
    : undefined
)

const genderChoices = computed(() =>
  sorted(
    Object.entries(GENDER_ICONS).map(([gender, icon]) => ({
      icon,
      gender,
      title: translateGender(t, gender as GenderTag)
    })),
    (g) => g.title
  )
)

const genderText = computed(
  () => genderTag.value && translateGender(t, genderTag.value)
)
const genderIcon = computed(() =>
  genderTag.value ? GENDER_ICONS[genderTag.value] : 'mdi-gender-male-female'
)
</script>

<template>
  <v-list-subheader :title="$t('speaker.gender.yours')" />
  <v-menu>
    <template #activator="{ props }">
      <v-list-item
        :title="genderText || $t('speaker.gender.select')"
        :prepend-icon="genderIcon"
        v-bind="props"
      />
    </template>
    <v-list>
      <v-list-subheader :title="$t('speaker.gender.selectDescription')" />
      <v-list-item
        v-for="{ icon, gender, title } in genderChoices"
        :active="gender === genderTag"
        color="primary"
        :disabled="gender === genderTag"
        :key="gender"
        :prepend-icon="icon"
        :title="title"
        @click="setTags('gen', gender)"
      />
      <v-list-item
        v-if="genderTag"
        base-color="warning"
        prepend-icon="mdi-close"
        :title="$t('clear')"
        @click="removeNamespace(['gen'])"
      />
    </v-list>
  </v-menu>
</template>
