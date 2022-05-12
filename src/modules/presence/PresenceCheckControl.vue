<template>
  <div v-if="presenceCheck">
    <h2>{{ t('presence.ongoingCheck') }}</h2>
    <p>
      <Moment :prepend="t('presence.openedAt')" :date="presenceCheck.opened"/>
    </p>
    <p class="my-2">
      {{ t('presence.presentCount', presenceCount) }}
    </p>
    <v-btn :disabled="submitting" v-if="canChange" @click="close()" color="warning" prepend-icon="mdi-stop">
      {{ t('presence.closeCheck') }}
    </v-btn>
  </div>
  <div v-else class="text-center my-8">
    <v-btn size="large" color="primary" @click="openCheck()" prepend-icon="mdi-hand-wave">
      {{ t('presence.newCheck') }}
    </v-btn>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import usePresence from '@/modules/presence/usePresence'

import Moment from '@/components/Moment.vue'

import { canChangePresenceCheck } from './rules'
import { presenceCheckClosed } from './events'
import useChannel from '@/composables/useChannel'

export default defineComponent({
  components: { Moment },
  setup () {
    const { t } = useI18n()
    const { presenceCheck, presenceCount, closeCheck, openCheck } = usePresence()
    const submitting = ref(false)

    async function close () {
      if (submitting.value || !presenceCheck.value) return
      submitting.value = true
      try {
        await closeCheck()
        presenceCheckClosed.emit(presenceCheck.value)
      } catch (err) {
        console.error(err)
      }
      submitting.value = false
    }

    useChannel('presence_check', computed(() => presenceCheck.value?.pk))
    // onBeforeMount(() => {
    //   props.subscribe && presenceCheck.value && presenceCheckType.channel.subscribe(presenceCheck.value.pk)
    // })
    // onBeforeUnmount(() => {
    //   props.subscribe && presenceCheck.value && presenceCheckType.channel.leave(presenceCheck.value.pk)
    // })

    const canChange = computed(() => presenceCheck.value && canChangePresenceCheck(presenceCheck.value))

    return {
      t,
      canChange,
      presenceCheck,
      presenceCount,
      submitting,
      close,
      openCheck
    }
  }
})
</script>

<style lang="sass" scoped>
.dropdown
  float: right
</style>
