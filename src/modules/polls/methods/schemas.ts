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

const getRepeatedSchulzeSchema: SchemaGenerator = (t, proposals) => {
  return [{
    name: 'winners',
    type: InputType.Number,
    label: t('winners'),
    required: true,
    settings: {
      min: 1,
      max: proposals.length
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

const getSchulzeSchema: SchemaGenerator = (t, proposals) => {
  return [
    {
      name: 'stars',
      type: InputType.Number,
      label: t('poll.schulze.numberOfStars'),
      required: true,
      settings: {
        min: 2
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

const schemas: Partial<Record<PollMethodName, SchemaGenerator>> = {
  irv: getInstantRunoffSchema,
  repeated_schulze: getRepeatedSchulzeSchema,
  schulze: getSchulzeSchema,
  scottish_stv: getSTVSchema
}
export default schemas
