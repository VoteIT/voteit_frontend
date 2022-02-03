<template>
  <div>
    <h2>{{ t('presence.ongoingCheck') }}</h2>
    <p>
      <Moment :prepend="t('presence.openedAt')" :date="check.opened"/>
    </p>
    <p class="my-2">
      {{ t('presence.presentCount', { count }) }}
    </p>
    <Btn :disabled="submitting" v-if="canChange" @click="closeCheck()" color="warning" icon="mdi-stop">{{ t('presence.closeCheck') }}</Btn>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, onBeforeUnmount, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import usePresence from '@/modules/presence/usePresence'
import { PresenceCheck } from '@/contentTypes/types'

import Moment from '@/components/Moment.vue'
import useMeeting from '../meetings/useMeeting'

import { canChangePresenceCheck } from './rules'
import { presenceCheckType } from './contentTypes'
import { presenceCheckClosed } from './events'

export default defineComponent({
  components: { Moment },
  props: {
    check: {
      type: Object as PropType<PresenceCheck>,
      required: true
    },
    subscribe: Boolean
  },
  setup (props) {
    const { t } = useI18n()
    const { meetingId } = useMeeting()
    const presence = usePresence(meetingId)
    const submitting = ref(false)

    async function closeCheck () {
      if (submitting.value) return
      submitting.value = true
      try {
        await presence.closeCheck(props.check)
        presenceCheckClosed.emit(props.check)
      } catch (err) {
        console.error(err)
      }
      submitting.value = false
    }

    onBeforeMount(() => {
      props.subscribe && presenceCheckType.channel.subscribe(props.check.pk)
    })
    onBeforeUnmount(() => {
      props.subscribe && presenceCheckType.channel.leave(props.check.pk)
    })

    const count = computed(() => presence.getPresenceCount(props.check))
    const canChange = computed(() => canChangePresenceCheck(props.check))

    return {
      t,
      canChange,
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
