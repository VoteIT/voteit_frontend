<template>
  <div class="d-flex">
    <v-text-field type="number" min="0" label="Minutes" v-model="duration.minutes" />
    <div class="mr-1" />
    <v-text-field type="number" min="0" max="59" label="Seconds" v-model="duration.seconds" />
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, watch } from 'vue'

export default defineComponent({
  props: {
    modelValue: {
      type: Number,
      default: 0
    }
  },
  setup (props, { emit }) {
    const duration = reactive({
      minutes: ref(Math.floor(props.modelValue / 60)),
      seconds: ref(props.modelValue % 60)
    })

    watch(duration, ({ minutes, seconds }) => {
      emit('update:modelValue', (minutes * 60) + seconds)
    })

    return {
      duration
    }
  }
})
</script>
