<script lang="ts" setup>
import { computed, Ref, ref, watch, type ComponentPublicInstance } from 'vue'
import { useI18n } from 'vue-i18n'

import { getFullName } from '@/utils'

import type { IUser } from '../organisations/types'
import useUserDetails from '../organisations/useUserDetails'
import { userType } from '../organisations/contentTypes'

import useMeeting from './useMeeting'
import useMeetingGroups from './useMeetingGroups'
import { Author, isGroupAuthor, isUserAuthor } from './types'
import useAuthStore from '../auth/useAuthStore'

interface AutocompleteItem {
  subtitle?: string
  subtitleIcon?: string
  title: string
  titleIcon?: string
  value: string
}

const emit = defineEmits<{ (e: 'update:modelValue', value: Author): void }>()
const props = defineProps<{
  modelValue?: Author
}>()

const authStore = useAuthStore()
const { isModerator, meetingId, postAs } = useMeeting()
const { meetingGroups, postAsGroups, getMeetingGroup } =
  useMeetingGroups(meetingId)
const { getUser } = useUserDetails()

// This means we're editing pre-existing content
const editingMode = !!props.modelValue

const author: Ref<Author> = editingMode ? ref(props.modelValue) : postAs

watch(
  author,
  (author) => {
    emit('update:modelValue', author)
  },
  { immediate: true }
)

/**
 * Convert API author value to a string used as value in select
 */
function authorToString(author: Author): string {
  return isGroupAuthor(author)
    ? `g:${author.author}:${author.meeting_group}`
    : isUserAuthor(author)
    ? `u:${author.author}`
    : `wg:${author.author}:${author.meeting_group}`
}

/**
 * Convert string value from select to API author value
 */
function stringToAuthor(value: string): Author {
  const [type, usr, grp] = value.split(':')
  switch (type) {
    case 'g':
      return {
        as_group: true,
        author: Number(usr),
        meeting_group: Number(grp)
      }
    case 'wg':
      return {
        as_group: false,
        author: Number(usr),
        meeting_group: Number(grp)
      }
    case 'u':
      return {
        as_group: false,
        author: Number(usr),
        meeting_group: null
      }
    default:
      throw new Error(`Unexpected type '${type}'`)
  }
}

/**
 * Convert Author to AutocompleteItem, used in select.
 */
function authorToAutocompleteItem(author: Author): AutocompleteItem {
  const value = authorToString(author)
  const user = getUser(author.author)
  const fullName = user ? getFullName(user) : '-'
  return isGroupAuthor(author)
    ? {
        title: getMeetingGroup(author.meeting_group)?.title ?? '-',
        titleIcon: 'mdi-account-multiple',
        value
      }
    : isUserAuthor(author)
    ? {
        subtitle: user?.userid ?? '-',
        title: fullName,
        value
      }
    : {
        subtitle: getMeetingGroup(author.meeting_group)?.title ?? '-',
        subtitleIcon: 'mdi-account-multiple',
        title: fullName,
        value
      }
}

function* userToAutocomplete(user: IUser): Generator<AutocompleteItem> {
  const base = {
    as_group: false,
    author: user.pk,
    meeting_group: null
  } as const
  yield authorToAutocompleteItem(base)
  for (const g of meetingGroups.value) {
    if (!g.members.includes(user.pk)) continue
    yield authorToAutocompleteItem({
      ...base,
      meeting_group: g.pk
    })
  }
}

function* usersToAutocomplete(users: IUser[]): Generator<AutocompleteItem> {
  for (const u of users) {
    for (const v of userToAutocomplete(u)) yield v
  }
}

const postAsSelect = computed<string | undefined>({
  get() {
    return authorToString(author.value)
  },
  set(newValue) {
    if (!newValue) return
    author.value = stringToAuthor(newValue)
  }
})

/**
 * Search options logic
 */
const searchOptions = ref<AutocompleteItem[]>([])
const search = ref('')
watch(search, async (search) => {
  // Only moderators can search other users
  if (!isModerator.value) return
  if (!search.length) {
    searchOptions.value = []
    return
  }
  const { data } = await userType.api.list({
    meeting: meetingId.value,
    search
  })
  searchOptions.value = [
    ...usersToAutocomplete(data.filter(({ pk }) => authStore.user?.pk !== pk))
  ]
})

const currentUserOptions = computed(() => [
  ...userToAutocomplete(authStore.user!)
])

const selectedAuthorOption = computed(() =>
  authorToAutocompleteItem(author.value)
)

const groupOptions = computed(() =>
  postAsGroups.value.map(({ pk }) =>
    authorToAutocompleteItem({
      as_group: true,
      author: authStore.user!.pk,
      meeting_group: pk
    })
  )
)

function* skipSelected(
  ...collection: AutocompleteItem[][]
): Generator<AutocompleteItem> {
  for (const items of collection) {
    for (const item of items) {
      if (item.value !== selectedAuthorOption.value.value) yield item
    }
  }
}

const options = computed(() => {
  return [
    selectedAuthorOption.value,
    ...skipSelected(
      currentUserOptions.value,
      groupOptions.value,
      searchOptions.value
    )
  ]
})

/**
 * Blur on selection (to get correct display)
 */
const autocomplete = ref<ComponentPublicInstance>()
watch(postAsSelect, () => {
  autocomplete.value?.$el.querySelector('input')?.blur()
})
</script>

<template>
  <v-autocomplete
    ref="autocomplete"
    v-if="options"
    :label="$t('proposal.postAs')"
    :items="options"
    v-model="postAsSelect"
    v-model:search="search"
    :no-data-text="$t('noSuggestions')"
    hide-details
    density="compact"
  >
    <template #item="{ item, props }">
      <v-list-item v-bind="props">
        <template #title>
          <v-icon v-if="item.raw.titleIcon" :icon="item.raw.titleIcon" />
          {{ item.raw.title }}
        </template>
        <template v-if="item.raw.subtitle" #subtitle>
          <v-icon v-if="item.raw.subtitleIcon" :icon="item.raw.subtitleIcon" />
          {{ item.raw.subtitle }}
        </template>
      </v-list-item>
    </template>
    <template #selection="{ item }">
      <span class="text-truncate">
        <v-icon v-if="item.raw.titleIcon" :icon="item.raw.titleIcon" />
        {{ item.raw.title }}
        <small v-if="item.raw.subtitle"
          >(<v-icon
            v-if="item.raw.subtitleIcon"
            :icon="item.raw.subtitleIcon"
          />{{ item.raw.subtitle }})</small
        >
      </span>
    </template>
  </v-autocomplete>
</template>
