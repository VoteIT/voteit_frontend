import { SchemaGenerator } from '@/components/inputs/types'
import { FieldType } from '@/components/types'
import { required } from '@/utils/rules'
import { PollMethodName } from './types'

const getSTVSchema: SchemaGenerator = (t, proposals) => {
  return [{
    name: 'winners',
    type: FieldType.Number,
    label: t('winners'),
    min: 1,
    max: proposals.length - 1,
    rules: [required]
  },
  {
    name: 'allow_random',
    type: FieldType.Checkbox,
    label: t('poll.allowRandomTiebreaker')
  }]
}

const getInstantRunoffSchema: SchemaGenerator = (t) => {
  return [{
    name: 'allow_random',
    type: FieldType.Checkbox,
    label: t('poll.allowRandomTiebreaker')
  }]
}

const getSchulzeSchema: SchemaGenerator = (t, proposals) => {
  return [
    {
      name: 'stars',
      type: FieldType.Number,
      label: t('poll.schulze.numberOfStars'),
      rules: [required],
      min: 3,
      max: 20
    },
    {
      name: 'deny_proposal',
      type: FieldType.Checkbox,
      rules: proposals.length < 3
        ? [required]
        : [],
      label: t('poll.schulze.addDenyProposal')
    }
  ]
}

const getRepeatedSchulzeSchema: SchemaGenerator = (t, proposals) => {
  return [
    {
      name: 'winners',
      type: FieldType.Number,
      label: t('winners'),
      min: 1,
      max: proposals.length,
      rules: [required]
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
      type: FieldType.Number,
      label: t(`poll.dutt.${name}`),
      hint: t('poll.dutt.minMaxHint'),
      min: 0,
      max
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
