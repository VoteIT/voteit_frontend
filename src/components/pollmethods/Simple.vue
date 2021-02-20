<template>
  <form @submit.prevent>
    <proposal read-only :p="p" v-for="p in proposals" :key="p.pk">
      <template v-slot:bottom>
        <div class="simple-options">
          <span class="vote-option" :style="{ backgroundColor: opt.value === votes.get(p.pk) ? opt.color : undefined }" :class="{ active: opt.value === votes.get(p.pk) }" v-for="opt in options" :key="opt.value">
            <label :for="`${p.pk}-${opt.value}`" tabindex="0" @click="change(p, opt)" @keyup.space.enter="change(p, opt)">
              <input :checked="opt.value === votes.get(p.pk)" type="radio" name="vote" :value="opt.value" :id="`${p.pk}-${opt.value}`" />
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
import { inject, reactive, watch } from 'vue'

import useMeeting from '@/composables/meeting/useMeeting'

import Proposal from '../widgets/Proposal'
import { DefaultMap } from '@/utils'

export default {
  name: 'SimplePoll',
  props: {
    poll: {
      type: Object,
      required: true
    },
    proposals: {
      type: Array,
      required: true
    },
    modelValue: Object
  },
  components: {
    Proposal
  },
  setup (props, { emit }) {
    const t = inject('t')
    const { getUser } = useMeeting()
    const votes = reactive(new Map())
    const isCombined = props.poll.method_name === 'combined_simple'

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

    if (isCombined) {
      options.push({
        value: 'abstain',
        title: t('poll.abstain'),
        icon: 'block',
        color: '#999'
      })
    }

    function change (proposal, opt) {
      votes.set(proposal.pk, opt.value)
      if (isCombined) {
        const map = new DefaultMap(_ => [])
        for (const [pk, choice] of votes.entries()) {
          map.get(choice).push(pk)
        }
        emit('update:modelValue', Object.fromEntries(map)) // TODO
      } else {
        emit('update:modelValue', { choice: opt.value })
      }
    }

    watch(_ => props.modelValue, vote => {
      if (isCombined) {
        for (const [choice, pks] of Object.entries(vote)) {
          pks.forEach(pk => {
            votes.set(pk, choice)
          })
        }
      } else {
        votes.set(props.proposals[0].pk, vote && vote.choice)
      }
    })

    return {
      change,
      votes,
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
