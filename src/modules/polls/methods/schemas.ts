import { InputType, SchemaGenerator } from '@/components/inputs/types'
import { PollMethodName } from './types'

const getSTVSchema: SchemaGenerator = (t, proposals) => {
  return [{
    name: 'winners',
    type: InputType.Number,
    label: t('winners'),
    required: true,
    settings: {
      min: 1,
      max: proposals.length - 1
    }
  },
  {
    name: 'allow_random',
    type: InputType.Checkbox,
    label: t('poll.allowRandomTiebreaker')
  }]
}

const getInstantRunoffSchema: SchemaGenerator = (t) => {
  return [{
    name: 'allow_random',
    type: InputType.Checkbox,
    label: t('poll.allowRandomTiebreaker')
  }]
}

const getSchulzeSchema: SchemaGenerator = (t, proposals) => {
  return [
    {
      name: 'stars',
      type: InputType.Number,
      label: t('poll.schulze.numberOfStars'),
      required: true,
      settings: {
        min: 3,
        max: 20
      }
    },
    {
      name: 'deny_proposal',
      type: InputType.Checkbox,
      required: proposals.length < 3,
      label: t('poll.schulze.addDenyProposal')
    }
  ]
}

const getRepeatedSchulzeSchema: SchemaGenerator = (t, proposals) => {
  return [
    {
      name: 'winners',
      type: InputType.Number,
      label: t('winners'),
      required: true,
      settings: {
        min: 1,
        max: proposals.length
      }
    },
    ...getSchulzeSchema(t, proposals)
  ]
}

const getDuttSchema: SchemaGenerator = (t, proposals) => {
  return ['min', 'max'].map(name => {
    // Don't allow requiring to select all proposals
    const max = name === 'min'
      ? proposals.length - 1
      : proposals.length
    return {
      name,
      type: InputType.Number,
      label: t(`poll.dutt.${name}`),
      hint: t('poll.dutt.minMaxHint'),
      settings: {
        min: 0,
        max
      }
    }
  })
}

const schemas: Partial<Record<PollMethodName, SchemaGenerator>> = {
  dutt: getDuttSchema,
  irv: getInstantRunoffSchema,
  repeated_schulze: getRepeatedSchulzeSchema,
  schulze: getSchulzeSchema,
  scottish_stv: getSTVSchema
}
export default schemas
