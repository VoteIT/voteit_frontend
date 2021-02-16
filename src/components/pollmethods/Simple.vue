<template>
  <form @submit.prevent>
    <proposal read-only :p="p" v-for="p in proposals" :key="p.pk">
      <template v-slot:bottom>
        <div class="simple-options">
          <span class="vote-option" :style="{ backgroundColor: opt.value === selected ? opt.color : undefined }" :class="{ active: opt.value === selected }" v-for="opt in options" :key="opt.value">
            <label :for="opt.value" tabindex="0" @click="change(opt.value)" @keyup.enter="change(opt.value)">
              <input :checked="opt.value === selected" type="radio" name="vote" :value="opt.value" :id="opt.value" />
              <icon sm :name="opt.icon" />
              {{ opt.title }}
            </label>
          </span>
        </div>
      </template>
    </proposal>
  </form>
</template>

<script>
import { inject, ref, watch } from 'vue'

import useMeeting from '@/composables/meeting/useMeeting'

import Proposal from '../widgets/Proposal'

export default {
  name: 'SimplePoll',
  props: {
    proposals: Array,
    modelValue: Object
  },
  components: {
    Proposal
  },
  setup (props, { emit }) {
    const t = inject('t')
    const { getUser } = useMeeting()
    const selected = ref(null)

    const options = [
      {
        value: 'yes',
        title: t('poll.approve'),
        icon: 'thumb_up',
        color: '#cdc'
      },
      {
        value: 'no',
        title: t('poll.deny'),
        icon: 'thumb_down',
        color: '#dcc'
      }
    ]

    function change (opt) {
      selected.value = opt
      emit('update:modelValue', { choice: opt })
    }

    watch(_ => props.modelValue, vote => {
      selected.value = vote && vote.choice
    })

    return {
      change,
      selected,
      options,
      getUser
    }
  }
}
</script>

<style lang="sass">
.simple-options
  text-align: center

.vote-option
  text-align: center
  margin-right: .5rem
  border: 1px solid #666
  border-radius: 6px
  background-color: #eee
  display: inline-block
  label
    padding: .5rem .5rem .4rem
    display: inline-block
    cursor: pointer
    .material-icons
      vertical-align: text-bottom
      margin-right: .2rem
  input
    display: none
  &.active
    box-shadow: 1px 1px 3px inset rgba(#000, .6)
  &:last-child
    margin-right: 0
</style>
