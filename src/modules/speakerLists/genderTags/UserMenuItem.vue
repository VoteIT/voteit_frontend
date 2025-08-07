<script setup lang="ts">
import { sorted } from 'itertools'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { userId } from '@/composables/useAuthentication'
import useParticipantTags from '@/modules/meetings/participantTags/useParticipantTags'
import useMeetingId from '@/modules/meetings/useMeetingId'

import { GENDER_ICONS, getGenderIcon, translateGender } from './utils'
import useGenderTag from './useGenderTag'

const { t } = useI18n()
const meetingId = useMeetingId()
const { removeNamespace, setTags } = useParticipantTags(meetingId)
const genderTag = useGenderTag(meetingId, userId)

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
const genderIcon = computed(() => getGenderIcon(genderTag.value))
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
