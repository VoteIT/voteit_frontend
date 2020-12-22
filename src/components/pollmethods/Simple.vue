<template>
  <form @submit.prevent>
    <div v-for="p in proposals" :key="p.pk">
      <p>Proposal {{ p.pk }} from {{ (authors.get(p.author) || {}).full_name }}:</p>
      <p>{{ p.title }}</p>
      <div class="simple-options">
        <p class="vote-option" :style="{ backgroundColor: opt.value === value ? opt.color : undefined }" :class="{ active: opt.value === value }" v-for="opt in options" :key="opt.value">
            <label :for="opt.value" tabindex="0" @click="change(opt)" @keyup.enter="change(opt)">
            <input :checked="opt.value === value" type="radio" name="vote" :value="opt.value" :id="opt.value" />
            <icon sm :name="opt.icon" />
            {{ opt.title }}
            </label>
        </p>
      </div>
    </div>
  </form>
</template>

<script>
import { ref } from 'vue'

const options = [
  {
    value: 'approve',
    title: 'Approve',
    icon: 'thumb_up',
    color: '#cdc'
  },
  {
    value: 'deny',
    title: 'Deny',
    icon: 'thumb_down',
    color: '#dcc'
  }
]

export default {
  name: 'SimplePoll',
  emits: ['valid'],
  props: {
    proposals: Array,
    authors: Map
  },
  setup (props, { emit }) {
    const value = ref(null)

    function change (opt) {
      value.value = opt.value
      emit('valid', opt.value)
    }

    return {
      change,
      value,
      options
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
