<template>
  <v-btn :prepend-icon="button.icon" size="small" :variant="reaction ? 'contained' : 'text'" :color="button.color" :disabled="disabled" :title="button.title" @click="toggle">
    {{ count }}
  </v-btn>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'

import useReactions from '@/modules/reactions/useReactions'
import { canAddReaction, canDeleteReaction } from './rules'
import { ReactionButton, ReactionRelation } from './types'

export default defineComponent({
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
    const { getUserReaction, setUserReacted, removeUserReacted, getButtonReactionCount } = useReactions()
    const reaction = computed(() => getUserReaction(props.button, props.relation))
    const count = computed(() => getButtonReactionCount(props.button, props.relation))

    function toggle () {
      if (reaction.value) {
        removeUserReacted(props.button, props.relation)
      } else {
        setUserReacted(props.button, props.relation)
      }
    }

    return {
      reaction,
      count,
      toggle,
      disabled: computed(() => reaction.value ? !canDeleteReaction(reaction.value) : !canAddReaction(props.button))
    }
  }
})
</script>
