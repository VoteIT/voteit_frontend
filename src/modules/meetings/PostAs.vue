<template>
  <v-autocomplete
    v-if="options"
    :label="t('proposal.postAs')"
    :items="options"
    v-model="postAs"
    v-model:search="search"
    :no-data-text="t('noSuggestions')"
    hide-details
    density="compact"
    />
</template>

<script lang="ts">
/* eslint-disable camelcase */
import { computed, defineComponent, PropType, reactive, Ref, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useAuthentication from '@/composables/useAuthentication'
import type { User } from '../organisations/types'
import useUserDetails from '../organisations/useUserDetails'

import useMeeting from './useMeeting'
import useMeetingGroups from './useMeetingGroups'
import { userType } from '../organisations/contentTypes'
import { Author } from './types'

interface AutocompleteItem {
  value: string
  title: string
}

// Remember post as selection by meeting id
const postAsDefaults = reactive(new Map<number, Partial<Author>>())

export default defineComponent({
  emits: ['update:modelValue'],
  props: {
    modelValue: Object as PropType<Author>
  },
  setup (props, { emit }) {
    const { t } = useI18n()
    const { user } = useAuthentication()
    const { meetingId, isModerator } = useMeeting()
    const { userGroups } = useMeetingGroups(meetingId)
    const { getUser } = useUserDetails()

    // This means we're editing existing content
    const editingMode = !!props.modelValue

    const value: Ref<Partial<Author>> = editingMode
      ? ref(props.modelValue)
      : computed({
        get () {
          return postAsDefaults.get(meetingId.value) || {
            author: user.value?.pk
          }
        },
        set (author) {
          if (author) postAsDefaults.set(meetingId.value, author)
        }
      })

    watch(value, author => {
      emit('update:modelValue', author)
    }, { immediate: true })

    function userToAutocomplete (user: User): AutocompleteItem {
      return {
        title: `${user.full_name} (${user.userid})`,
        value: `user:${user.pk}`
      }
    }
    const postAs = computed<string | undefined>({
      get () {
        if (!value.value) return
        const { meeting_group, author } = value.value
        return meeting_group
          ? `group:${meeting_group}`
          : `user:${author}`
      },
      set (newValue) {
        if (!newValue) return
        const [type, pk] = newValue.split(':')
        value.value = type === 'group'
          ? { meeting_group: Number(pk) }
          : { author: Number(pk), meeting_group: null }
      }
    })
    const search = ref('')
    function getInitialUserOption () {
      const author = value.value.author
      if (author && author !== user.value?.pk) {
        const user = getUser(author)
        if (user) return [userToAutocomplete(user)]
      }
      return []
    }
    const userOptions = ref<AutocompleteItem[]>(getInitialUserOption())

    function preserveCurrentAuthor (newOptions?: AutocompleteItem[]): AutocompleteItem[] {
      newOptions = newOptions ?? []
      const { author } = value.value
      if (!author) return newOptions
      const finder = (item: AutocompleteItem) => author === Number(item.value.split(':')[1])
      // Ok, it's in the new options as well
      if (newOptions.find(finder)) return newOptions
      // Not in new options - preserve this
      const preserve = userOptions.value.find(finder)
      // Should always find this, but let's not take anything for granted
      return preserve
        ? [preserve, ...newOptions]
        : newOptions
    }

    watch(search, async (search: string) => {
      // Only moderators can switch user
      if (!isModerator) return
      if (!search.length) {
        userOptions.value = preserveCurrentAuthor()
        return
      }
      const { data } = await userType.api.list({
        meeting: meetingId.value,
        search
      })
      const newOptions = data
        .filter(({ pk }) => user.value?.pk !== pk)
        .map(userToAutocomplete)
      userOptions.value = preserveCurrentAuthor(newOptions)
    })
    const options = computed(() => {
      if (!isModerator || !userGroups.value.length) return
      return [
        user.value
          ? userToAutocomplete(user.value)
          : { // Should not happen
            value: null,
            title: 'self'
          },
        ...userGroups.value.map(({ pk, title }) => ({ value: `group:${pk}`, title })),
        ...userOptions.value
      ]
    })

    return {
      t,
      postAs,
      options,
      search,
      userOptions
    }
  }
})
</script>
