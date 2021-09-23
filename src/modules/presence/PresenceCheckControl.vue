<template>
  <div>
    <h3>{{ t('presence.ongoingCheck') }}</h3>
    <p><Moment :prepend="t('presence.openedAt')" :date="check.opened"/></p>
    <p>{{ t('presence.presentCount', { count }) }}</p>
    <Btn :disabled="submitting" v-if="canChange(check)" @click="closeCheck()" color="warning" icon="mdi-stop">{{ t('presence.closeCheck') }}</Btn>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, onBeforeUnmount, PropType, ref } from 'vue'

import usePresence from '@/modules/presence/usePresence'
import presenceCheckType from '@/contentTypes/presenceCheck'
import { PresenceCheck } from '@/contentTypes/types'

import Moment from '@/components/Moment.vue'

export default defineComponent({
  components: { Moment },
  inject: ['t'],
  props: {
    check: {
      type: Object as PropType<PresenceCheck>,
      required: true
    },
    subscribe: Boolean
  },
  setup (props) {
    const presence = usePresence()
    const submitting = ref(false)
    const channel = presenceCheckType.getChannel()

    async function closeCheck () {
      if (submitting.value) return
      submitting.value = true
      try {
        await presence.closeCheck(props.check)
      } catch (err) {
        console.error(err)
      }
      submitting.value = false
    }

    onBeforeMount(() => {
      props.subscribe && channel.subscribe(props.check.pk)
    })
    onBeforeUnmount(() => {
      props.subscribe && channel.leave(props.check.pk)
    })

    const count = computed(() => presence.getPresenceCount(props.check))

    return {
      ...presenceCheckType.rules,
      count,
      submitting,
      closeCheck
    }
  }
})
</script>

<style lang="sass" scoped>
.dropdown
  float: right
</style>
