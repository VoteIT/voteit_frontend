<template>
  <span class="text-no-wrap mr-1">
    <v-btn :prepend-icon="button.icon" size="small" :variant="canReact ? 'text' : 'tonal'" :color="reaction ? button.color : 'secondary'" :disabled="!canReact" @click="toggle">
      {{ button.title }}
    </v-btn>
    <v-dialog v-model="listOpen">
      <template #activator="{ props }">
        <v-btn variant="text" flat size="small" v-bind="props" :disabled="!canListReactions" class="reaction-count">
          {{ count }}
        </v-btn>
      </template>
      <template v-slot="{ isActive }">
        <v-sheet class="pa-4">
          <div class="d-flex mb-2">
            <h2 class="flex-grow-1">
              {{ t('reaction.peopleReacted') }}
            </h2>
            <v-btn icon="mdi-close" flat @click="isActive.value = false" class="mt-n2 mr-n2" />
          </div>
          <UserList :userIds="reactionUsers" />
        </v-sheet>
      </template>
    </v-dialog>
  </span>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'

import UserList from '@/components/UserList.vue'
import useReactions from './useReactions'
import { canAddReaction, canDeleteReaction, canListReactions } from './rules'
import { ReactionButton, ReactionRelation } from './types'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  components: {
    UserList
  },
  props: {
    button: {
      type: Object as PropType<ReactionButton>,
      required: true
    },
    relation: {
      type: Object as PropType<ReactionRelation>,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()
    const { fetchReactions, getUserReaction, setUserReacted, removeUserReacted, getButtonReactionCount } = useReactions()
    const reaction = computed(() => getUserReaction(props.button, props.relation))
    const count = computed(() => getButtonReactionCount(props.button, props.relation))
    const reactionUsers = ref<number[]>([])

    function toggle () {
      if (reaction.value) {
        removeUserReacted(props.button, props.relation)
      } else {
        setUserReacted(props.button, props.relation)
      }
    }

    const listOpen = ref(false)
    watch(listOpen, async (value) => {
      if (!value) return
      const data = await fetchReactions(props.button, props.relation)
      reactionUsers.value = data.users
    })

    return {
      t,
      canReact: computed(() => reaction.value ? canDeleteReaction(reaction.value) : canAddReaction(props.button)),
      canListReactions: computed(() => !!count.value && canListReactions(props.button)),
      count,
      listOpen,
      reaction,
      reactionUsers,
      toggle
    }
  }
})
</script>

<style lang="sass">
.reaction-count
  min-width: unset !important
</style>
