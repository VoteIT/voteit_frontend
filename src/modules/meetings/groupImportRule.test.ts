import { describe, expect, test } from 'vitest'
import { ComposerTranslation } from 'vue-i18n'

import useRules from '@/composables/useRules'

import { groupImportRule } from './groupImportRule'

const t = ((key: string, arg?: unknown) =>
  arg === undefined ? key : `${key}:${arg}`) as ComposerTranslation
const rule = groupImportRule(useRules(t))

describe('groupImportRule', () => {
  test.each([
    ['title only', 'Habo'],
    ['title and groupid', 'Habo\thabo'],
    ['empty groupid', 'Habo\t'],
    ['empty groupid with votes', 'Habo\t\t3'],
    ['all columns', 'Habo\thabo\t3'],
    ['empty votes', 'Habo\thabo\t'],
    ['zero votes', 'Habo\thabo\t0'],
    ['groupid at max length', `Habo\t${'x'.repeat(100)}`],
    ['mixed column counts', 'Habo\nHåbo\thabo-1\nMora\t\t2'],
    ['blank lines', 'Habo\n\nHåbo\n'],
    ['empty input', '']
  ])('accepts %s', (_, value) => {
    expect(rule(value)).toBe(true)
  })

  test.each([
    ['missing title', '\thabo', 1],
    ['whitespace title', ' \thabo', 1],
    ['negative votes', 'Habo\t\t-1', 1],
    ['non-numeric votes', 'Habo\t\tmany', 1],
    ['too many columns', 'Habo\thabo\t3\textra', 1],
    ['groupid over max length', `Habo\t${'x'.repeat(101)}`, 1],
    ['bad row after good ones', 'Habo\nHåbo\n\tmora', 3]
  ])('rejects %s', (_, value, row) => {
    const result = rule(value)
    expect(result).not.toBe(true)
    expect(result).toMatch(new RegExp(`^rules\\.multilineFailed:${row}: `))
  })
})
