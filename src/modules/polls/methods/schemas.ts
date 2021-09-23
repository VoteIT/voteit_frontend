import { InputType, SchemaGenerator } from '@/components/inputs/types'

const getSTVSchema: SchemaGenerator = (t, proposals) => {
  return [{
    name: 'winners',
    type: InputType.Number,
    label: t('winners'),
    settings: {
      min: 1,
      max: proposals - 1
    }
  },
  {
    name: 'allow_random',
    type: InputType.Checkbox,
    label: t('poll.allowRandomTiebreaker')
  }]
}

const getRepeatedSchulzeSchema: SchemaGenerator = (t, proposals) => {
  return [{
    name: 'winners',
    type: InputType.Number,
    label: t('winners'),
    settings: {
      min: 1,
      max: proposals
    }
  }]
}

const getInstantRunoffSchema: SchemaGenerator = (t) => {
  return [{
    name: 'allow_random',
    type: InputType.Checkbox,
    label: t('poll.allowRandomTiebreaker')
  }]
}

export default {
  scottish_stv: getSTVSchema,
  repeated_schulze: getRepeatedSchulzeSchema,
  irv: getInstantRunoffSchema
} as Record<string, SchemaGenerator>
