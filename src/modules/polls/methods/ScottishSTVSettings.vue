<template>
  <div>
    <p class="number">
      <label for="poll-settings-winners">{{ t('winners') }}</label>
      <input id="poll-settings-winners" v-model="settings.winners" type="number" :min="method.winnersMin || 1" :max="proposals - (method.losersMin || 1)">
    </p>
    <p class="checkbox">
      <input id="poll-setting-random" type="checkbox" v-model="settings.allow_random">
      <label for="poll-setting-random">{{ t('poll.allowRandomTiebreaker') }}</label>
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive, watch } from 'vue'
import { PollMethod, ScottishSTVSettings } from './types'

export default defineComponent({
  inject: ['t'],
  props: {
    modelValue: {
      type: Object as PropType<ScottishSTVSettings>,
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

    watch(settings, value => emit('update:modelValue', value))
    return {
      settings
    }
  }
})
</script>
