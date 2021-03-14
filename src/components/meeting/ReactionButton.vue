<template>
  <v-btn size="small" :plain="!reaction || disabled" :color="button.color" :disabled="disabled" :title="button.title" @click="toggle">
    <icon left :icon="icon"/> {{ count }}
  </v-btn>
</template>

<script lang="ts">
import useReactions from '@/composables/meeting/useReactions'
import { ReactionRelation } from '@/contentTypes/reaction'
import rules from '@/contentTypes/reaction/rules'
import { ReactionButton } from '@/contentTypes/reactionButton'
import { computed, defineComponent, PropType } from 'vue'
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
      disabled: computed(() => reaction.value ? !rules.canDelete(reaction.value) : !rules.canAdd(props.button)),
      icon: computed(() => 'mdi-' + props.button.icon.replaceAll('_', '-')), // FIXME
      ...rules
    }
  }
})
</script>
