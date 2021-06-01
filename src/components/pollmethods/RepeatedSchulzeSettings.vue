<template>
  <div>
    <p class="number">
      <label for="poll-setting-winners">{{ t('winners') }}</label>
      <input id="poll-setting-winners" v-model="settings.winners" type="number" :min="method.winnersMin || 1" :max="proposals - (method.losersMin || 1)" :disabled="orderAll">
    </p>
    <p class="checkbox">
      <input id="poll-setting-order-all" type="checkbox" v-model="orderAll">
      <label for="poll-setting-order-all">{{ t('poll.orderAll') }}</label>
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive, ref, watch } from 'vue'
import { PollMethod, RepeatedSchulzeSettings } from './types'

export default defineComponent({
  inject: ['t'],
  props: {
    modelValue: {
      type: Object as PropType<RepeatedSchulzeSettings>,
      required: true
    },
    proposals: {
      type: Number,
      required: true
    },
    method: {
      type: Object as PropType<PollMethod>,
      required: true
    }
  },
  setup (props, { emit }) {
    const settings = reactive(props.modelValue)
    const orderAll = ref(false)

    function watcher () {
      emit('update:modelValue', { winners: orderAll.value ? null : settings.winners })
    }

    watch(orderAll, watcher)
    watch(settings, watcher)

    return {
      settings,
      orderAll
    }
  }
})
</script>
